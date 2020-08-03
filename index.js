// Beakermentions Validator (index.js) - A target and source validator of
// the W3C Webmention recommendation for Beaker Browser users.
// 
// Written in 2020 by Don Geronimo <email@sentamal.in>
//
// To the extent possible under law, the author(s) have dedicated all copyright
// and related and neighboring rights to this software to the public domain
// worldwide. This software is distributed without any warranty.
// 
// You should have received a copy of the CC0 Public Domain Dedication along
// with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

export class WebmentionValidator {
  #domParser;
  #htmlRegex = new RegExp(/\.html?$/i);
  #relRegex = new RegExp(/rel=.*webmention.*/i);
  #contentHTML = new RegExp(/text\/html/i);
  #contentXHTML = new RegExp(/application\/xhtml\+xml/i);

  /********** Constructor/Init **********/

  constructor(options = {}) {
    if (options.domParser) { this.#domParser = options.domParser; }
    else { this.#domParser = new DOMParser(); }
  }

  /********** Public Methods **********/

  async checkSource(source, target) {
    let output = false;
    const sourceRegex = RegExp(target);
    const url = new URL(source);
    let sourcePath = url.pathname.toString();

    // First, try to find the target reference through Beaker
    if (source.startsWith("hyper://")) {
      let sourceHyperdrive = beaker.hyperdrive.drive(url.origin.toString());
      try {
        let sourceStat = await sourceHyperdrive.stat(sourcePath);
        // Check the path. If it's a file, continue. If it's a directory, look for another file in its place
        if (!sourceStat.isFile()) {
          const output = await this.#checkHyperdrivePath(sourcePath, sourceHyperdrive);
          if (output) {
            sourcePath = output.path;
            sourceStat = output.stat;
          }
        }
        if (sourceStat.isFile()) {
          // Check if the source references the target in metadata
          let metadata = JSON.stringify(sourceStat.metadata);
          if (sourceRegex.test(metadata)) {
            console.debug("WebmentionValidator.checkSource: target URL found in metadata.");
            output = true;
          }

          // Check if the source references the target in its HTML
          if (!output) {
            let sourceFile = await sourceHyperdrive.readFile(sourcePath, "utf8");
            if (this.#htmlRegex.test(sourcePath)) {
              if (this.#checkTargetInSourceHTML(sourceFile, target)) {
                console.debug("WebmentionValidator.checkSource: target URL found in HTML.");
                output = true;
              }
            }

            // Check if the source references the target in its contents
            if (!output) {
              if (sourceRegex.test(sourceFile)) {
                console.debug("WebmentionValidator.checkSource: target URL found in content.");
                output = true;
              }
            }
          }
        } else { throw "Couldn't find a file to check at this URL."; }
      } catch (error) { console.error("WebmentionValidator.checkSource:", error); }
    }

    // If not through Beaker, use standard Fetch API requests
    else {
      try {
        let response = await fetch(source);
        if (response.ok) {
          // Check if the source references the target in its HTML
          let sourceFile = await response.text();
          let contentType = response.headers.get("content-type");
          if (this.#contentHTML.test(contentType) || this.#contentXHTML.test(contentType)) {
            if (this.#checkTargetInSourceHTML(sourceFile, target)) {
              console.debug("WebmentionValidator.checkSource: target URL found in HTML.");
              output = true;
            }
          }

          // Check if the source references the target in its content
          if (!output) {
            if (sourceRegex.test(sourceFile)) {
              console.debug("WebmentionValidator.checkSource: target URL found in content.");
              output = true;
            }
          }
        } else { throw `Response header returned status ${headers.status} - ${headers.statusText}`; }
      } catch (error) { console.error("WebmentionValidator.checkSource:", error); }
    }
    return output;
  }

  async getTargetEndpoint(target) {
    let output = null;
    const url = new URL(target);
    let targetPath = url.pathname.toString();
    let targetRedirect = null;

    // First, try to find @webmention in Beaker
    if (target.startsWith("hyper://")) {
      let targetHyperdrive = beaker.hyperdrive.drive(url.origin.toString());
      try {
        let targetStat = await targetHyperdrive.stat(targetPath);
        // Check the path. If it's a file, continue. If it's a directory, look for another file in its place
        if (!targetStat.isFile()) {
          const output = await this.#checkHyperdrivePath(targetPath, targetHyperdrive);
          if (output) {
            targetPath = output.path;
            targetStat = output.stat;
          }
        }
        if (targetStat.isFile()) {
          // Check if the metadata mentions this endpoint as @webmention
          if (targetStat.metadata) {
            if (targetStat.metadata.webmention) {
              console.debug("WebmentionValidator.getTargetEndpoint: webmention found in metadata.");
              output = targetStat.metadata.webmention;
            }
          }

          // Check if any <a> or <link> tags mention the endpoint with @rel="webmention"
          if (!output) {
            let targetFile = await targetHyperdrive.readFile(targetPath, "utf8");
            if (this.#htmlRegex.test(targetPath)) {
              let endpointURL = this.#getEndpointInTargetHTML(targetFile);
              if (endpointURL || (endpointURL === "")) {
                console.debug("WebmentionValidator.getTargetEndpoint: webmention found in HTML.");
                output = endpointURL;
              }
            }
          }
        } else { throw "Couldn't find a file to check at this URL."; }
      } catch (error) { console.error("WebmentionValidator.getTargetEndpoint:", error); }
    }

    // If not through Beaker, use HTTP Link Headers and Fetch API Requests
    else {
      try {
        // First, check HEAD for an HTTP Link Header
        const headers = await fetch(target, {
          method: "HEAD"
        });
        if (headers.ok) {
          const linkHeadersString = headers.headers.get("link");
          if (linkHeadersString !== null) {
            const linkHeaders = linkHeadersString.split(", ");
            linkHeaders.forEach(element => {
              if (!output) {
                const url = element.substring(element.lastIndexOf("<") + 1, element.lastIndexOf(">"));
                const linkParams = element.split(";");
                linkParams.forEach(param => {
                  if (!output) {
                    if (this.#relRegex.test(param)) {
                      console.debug("WebmentionValidator.getTargetEndpoint: webmention found in HTTP Headers.");
                      output = url;
                    }
                  }
                });
              }
            });
          }
        } else { throw `Response header returned status ${headers.status} - ${headers.statusText}`; }

        // Then check the HTML
        if (!output) {
          const response = await fetch(target);
          if (response.ok) {
            // Before anything, check to see if the URL has been redirected
            if (response.redirected) { targetRedirect = response.url; }
            const contentType = response.headers.get("content-type");
            if (this.#contentHTML.test(contentType) || this.#contentXHTML.test(contentType)) {
              const targetFile = await response.text();
              const endpointURL = this.#getEndpointInTargetHTML(targetFile);
              if (endpointURL || (endpointURL === "")) {
                console.debug("WebmentionValidator.getTargetEndpoint: webmention found in HTML.");
                output = endpointURL;
              }
            }
          } else { throw `Response header returned status ${headers.status} - ${headers.statusText}`; }
        }
      } catch (error) { console.error("WebmentionValidator.getTargetEndpoint:", error); }
    }

    if (output || (output === "")) {
      if (targetRedirect) { output = new URL(output, targetRedirect); }
      else { output = new URL(output, target); }
    }
    if (output) { return output.toString(); }
    else { return output; }
  }

  /********** Private Methods **********/

  #checkTargetInSourceHTML(sourceFile, target) {
    let output = true;
    let sourceDom = this.#domParser.parseFromString(sourceFile, "text/html");
    let hrefQuery = `*[href="${target}"]`;
    let srcQuery = `*[src="${target}"]`;
    let hrefInDom = sourceDom.querySelector(hrefQuery);
    let srcInDom = sourceDom.querySelector(srcQuery);
    if ((hrefInDom === null) && (srcInDom === null)) { output = false; }
    return output;
  }

  #getEndpointInTargetHTML(targetFile) {
    let output = null;
    let targetDom = this.#domParser.parseFromString(targetFile, "text/html");
    let webmention = targetDom.querySelectorAll("*[rel~='webmention']");
    webmention.forEach(element => {
      if ((!output) && (output !== "")) {
        if (element.hasAttribute("href")) {
          if (element.getAttribute("href") === null) {
            output = "";
          } else {
            output = element.getAttribute("href");
          }
        }
      }
    });
    return output;
  }

  async #checkHyperdrivePath(path, hyperdrive) {
    async function checkFile(file) {
      output = null;
      try {
        const stat = await hyperdrive.stat(`${path}${file}`);
        if (stat.isFile()) {
          output = {
            path: `${path}${file}`,
            stat: stat
          };
        }
      } catch {}
      return output;
    }

    let output = null;
    const files = [
      "index.html",
      "index.md"
    ];

    for (let i = 0; i < files.length; i++) {
      output = await checkFile(files[i]);
      if (output) { break; }
    }

    return output;
  }
}