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
  #endpointRegex = new RegExp(/<.*>/);
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
    let sourceRegex = RegExp(target);
    let sourceSplit = source.split("/");
    let sourceHost = `${sourceSplit[0]}//${sourceSplit[2]}/`;
    for (let i = 0; i < 3; i++) { sourceSplit.shift(); }
    let sourcePath = `/${sourceSplit.join("/")}`;

    // First, try to find the target reference through Beaker
    try {
      let sourceHyperdrive = beaker.hyperdrive.drive(sourceHost);
      let sourceStat = await sourceHyperdrive.stat(sourcePath);
      // Check the path. If it's a file, continue. If it's a directory, look for 'index.html,' then 'index.md.'
      if (!sourceStat.isFile()) {
        let newPath = `${sourcePath}index.html`;
        try {
          let newStat = await sourceHyperdrive.stat(newPath);
          if (newStat.isFile()) { 
            sourcePath = newPath;
            sourceStat = newStat;
          }
        } catch {}
      }
      if (!sourceStat.isFile()) {
        let newPath = `${sourcePath}index.md`;
        try {
          let newStat = await sourceHyperdrive.stat(newPath);
          if (newStat.isFile()) {
            sourcePath = newPath;
            sourceStat = newStat;
          }
        } catch {}
      }
      if (sourceStat.isFile()) {
        // Check if the source references the target in metadata
        console.debug("WebmentionValidator.checkSource: Checking metadata for 'target.'");
        let metadata = JSON.stringify(sourceStat.metadata);
        if (sourceRegex.test(metadata)) {
          console.debug("WebmentionValidator.checkSource: 'target' found in metadata.");
          output = true;
        }

        // Check if the source references the target in its HTML
        if (!output) {
          let sourceFile = await sourceHyperdrive.readFile(sourcePath, "utf8");
          if (this.#htmlRegex.test(sourcePath)) {
            console.debug("WebmentionValidator.checkSource: Is HTML; checking @href/@src for 'target.'");
            if (this.#checkTargetInSourceHTML(sourceFile, target)) {
              console.debug("WebmentionValidator.checkSource: 'target' found in HTML.");
              output = true;
            }
          }

          // Check if the source references the target in its contents
          if (!output) {
            console.debug("WebmentionValidator.checkSource: Checking content for 'target.'");
            if (sourceRegex.test(sourceFile)) {
              console.debug("WebmentionValidator.checkSource: 'target' found in content.");
              output = true;
            }
          }
        }
      }
    
    // If not through Beaker, use standard Fetch API requests
    } catch {
      try {
        console.debug("WebmentionValidator.checkSource: Using Hyperdrive API failed; using Fetch API.");
        let response = await fetch(source);
        if (response.ok) {
          // Check if the source references the target in its HTML
          let sourceFile = await response.text();
          let contentType = response.headers.get("content-type");
          if (this.#contentHTML.test(contentType) || this.#contentXHTML.test(contentType)) {
            console.debug("WebmentionValidator.checkSource: Is HTML; checking @href/@src for 'target.'");
            if (this.#checkTargetInSourceHTML(sourceFile, target)) {
              console.debug("WebmentionValidator.checkSource: 'target' found in HTML.");
              output = true;
            }
          }

          // Check if the source references the target in its content
          if (!output) {
            console.debug("WebmentionValidator.checkSource: Checking content for 'target.'");
            if (sourceRegex.test(sourceFile)) {
              console.debug("WebmentionValidator.checkSource: 'target' found in content.");
              output = true;
            }
          }
        }
      } catch (error) {
        console.error("WebmentionValidator.checkSource:", error);
      }
    }
    return output;
  }

  async getTargetEndpoint(target) {
    let output = null;
    let targetSplit = target.split("/");
    let targetHost = `${targetSplit[0]}//${targetSplit[2]}/`;
    for (let i = 0; i < 3; i++) { targetSplit.shift(); }
    let targetPath = `/${targetSplit.join("/")}`;
    let targetRedirect = null;

    // First, try to find @webmention in Beaker
    try {
      let targetHyperdrive = beaker.hyperdrive.drive(targetHost);
      let targetStat = await targetHyperdrive.stat(targetPath);
      // Check the path. If it's a file, continue. If it's a directory, look for 'index.html,' then 'index.md.'
      if (!targetStat.isFile()) {
        let newPath = `${targetPath}index.html`;
        try {
          let newStat = await targetHyperdrive.stat(newPath);
          if (newStat.isFile()) { 
            targetPath = newPath;
            targetStat = newStat;
          }
        } catch {}
      }
      if (!targetStat.isFile()) {
        let newPath = `${targetPath}index.md`;
        try {
          let newStat = await targetHyperdrive.stat(newPath);
          if (newStat.isFile()) {
            targetPath = newPath;
            targetStat = newStat;
          }
        } catch {}
      }
      if (targetStat.isFile()) {
        // Check if the metadata mentions this endpoint as @webmention
        if (targetStat.metadata) {
          console.debug("WebmentionValidator.getTargetEndpoint: Checking metadata for @webmention.");
          if (targetStat.metadata.webmention) {
            console.debug("WebmentionValidator.getTargetEndpoint: @webmention found in metadata.");
            output = targetStat.metadata.webmention;
          }
        }

        // Check if any <a> or <link> tags mention the endpoint with @rel="webmention"
        if (!output) {
          let targetFile = await targetHyperdrive.readFile(targetPath, "utf8");
          if (this.#htmlRegex.test(targetPath)) {
            console.debug("WebmentionValidator.getTargetEndpoint: Is HTML; checking for @rel=webmention.");
            let endpointURL = this.#getEndpointInTargetHTML(targetFile);
            if (endpointURL || (endpointURL === "")) {
              console.debug("WebmentionValidator.getTargetEndpoint: @webmention found in HTML element with @rel=webmention.");
              output = endpointURL;
            }
          }
        }
      }
    }

    // If not through Beaker, use HTTP Link Headers and Fetch API Requests
    catch {
      try {
        console.debug("WebmentionValidator.getTargetEndpoint: Using Hyperdrive API failed; using Fetch API.");

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
                if (this.#relRegex.test(element)) {
                  const url = element.match(this.#endpointRegex);
                  console.debug("WebmentionValidator.getTargetEndpoint: 'webmention' found in HTTP Link Headers.");
                  output = url.slice(1, url.length - 1);
                  console.debug("WebmentionValidator.getTargetEndpoint: output -", output);
                }
              }
            });
          }
        }

        // Then check the HTML
        if (!output) {
          const response = await fetch(target, {
            method: "GET"
          });
          if (response.ok) {
            // Before anything, check to see if the URL has been redirected
            if (response.redirected) { targetRedirect = response.url; }
            const contentType = response.headers.get("content-type");
            if (this.#contentHTML.test(contentType) || this.#contentXHTML.test(contentType)) {
              console.debug("WebmentionValidator.getTargetEndpoint: Is (X)HTML; checking for @rel=webmention.");
              const targetFile = await response.text();
              const endpointURL = this.#getEndpointInTargetHTML(targetFile);
              if (endpointURL || (endpointURL === "")) {
                console.debug("WebmentionValidator.getTargetEndpoint: @webmention found in HTML element with @rel=webmention.");
                output = endpointURL;
              }
            }
          }
        }
      } catch (error) {
        console.error("WebmentionValidator.getTargetEndpoint:", error);
      }
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
    console.log("WebmentionEndpoint.#getEndpointInTargetHTML: output -", output);
    return output;
  }
}