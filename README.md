# Beakermentions Validator

[Beakermentions Validator][1] is a target and source validator of the [W3C][2] [Webmention][3] recommendation for [Beaker Browser][4] users. Webmentions are a simple way to notify any URL when you mention it from another URL. 

This provides a `WebmentionValidator` object that can be used by other applications. It provides two methods:

* `checkSource(source, target)` - Check a `source` URL for references to a `target` URL. Returns a `boolean`.
* `getTargetEndpoint(target)` - Checks a `target` URL for a webmention endpoint. Returns a `string` URL of the Webmention endpoint, or `null` if not found.

## License

Written in 2020 by [Don Geronimo][7]. To the extent possible under law, Don Geronimo has waived all copyright and related or neighboring rights to Beakermentions Validator by publishing it under the [CC0 1.0 Universal Public Domain Dedication][8]. This work is published from the United States.

[Satellite Antenna Emoji][10] designed by [OpenMoji][11] – the open-source emoji and icon project. License: [CC BY-SA 4.0][12]. Changes: Removed empty padding and added license information in the file's metadata.

Made with ❤️ and JavaScript. Please freely share and remix.

[1]: hyper://18757df1063e9c2cbc539910b6e92f973c51cd54fd4532a72bd583749d22c4a0/
[2]: https://www.w3.org/
[3]: https://www.w3.org/TR/webmention/
[4]: https://beakerbrowser.com/
[5]: https://docs.beakerbrowser.com/apis/beaker.hyperdrive/
[6]: https://docs.beakerbrowser.com/apis/beaker.peersockets/
[7]: hyper://9fa076bdc2a83f6d0d32ec010a71113b0d25eccf300a5eaedf72cf3326546c9a/
[8]: hyper://18757df1063e9c2cbc539910b6e92f973c51cd54fd4532a72bd583749d22c4a0/LICENSE
[9]: https://developer.mozilla.org/en-US/docs/Web/API/Location/search
[10]: hyper://18757df1063e9c2cbc539910b6e92f973c51cd54fd4532a72bd583749d22c4a0/thumb.svg
[11]: https://openmoji.org/
[12]: https://creativecommons.org/licenses/by-sa/4.0/#