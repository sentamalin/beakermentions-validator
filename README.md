# Beakermentions Validator

[Beakermentions Validator][1] is a target and source validator of the [W3C][2] [Webmention][3] recommendation for [Beaker Browser][4] users. Webmentions are a simple way to notify any URL when you mention it from another URL. 

This module provides a `WebmentionValidator` object that can be used by other applications. It provides two methods:

* `checkSource(source, target)` - Check a `source` URL for references to a `target` URL. Returns a `boolean`.
* `getTargetEndpoint(target)` - Checks a `target` URL for a webmention endpoint. Returns a `string` URL of the Webmention endpoint, or `null` if not found.

A [test page][5] is available. For more information on Beakermentions, visit [Beakermentions: Webmentions for Beaker Browser][11]

## This Project Is Archived

It was cool at the time to be able to essentially send and receive webmentions, but as I've started working more and more at my primary job post-pandemic, I've been coding less and less on this. As Beaker Browser is archived as of 27 December 2022, consequently I'm archiving Beakermentions, Beakermentions Endpoint, and Beakermentions Validator.

## License

Written in 2020 by [Don Geronimo][6]. To the extent possible under law, Don Geronimo has waived all copyright and related or neighboring rights to Beakermentions Validator by publishing it under the [CC0 1.0 Universal Public Domain Dedication][7]. This work is published from the United States.

[Satellite Antenna Emoji][8] designed by [OpenMoji][9] – the open-source emoji and icon project. License: [CC BY-SA 4.0][10]. Changes: Removed empty padding and added license information in the file's metadata.

Made with ❤️ and JavaScript. Please freely share and remix.

[1]: hyper://18757df1063e9c2cbc539910b6e92f973c51cd54fd4532a72bd583749d22c4a0/
[2]: https://www.w3.org/
[3]: https://www.w3.org/TR/webmention/
[4]: https://beakerbrowser.com/
[5]: hyper://18757df1063e9c2cbc539910b6e92f973c51cd54fd4532a72bd583749d22c4a0/test/
[6]: hyper://9fa076bdc2a83f6d0d32ec010a71113b0d25eccf300a5eaedf72cf3326546c9a/
[7]: hyper://18757df1063e9c2cbc539910b6e92f973c51cd54fd4532a72bd583749d22c4a0/LICENSE
[8]: hyper://18757df1063e9c2cbc539910b6e92f973c51cd54fd4532a72bd583749d22c4a0/thumb.svg
[9]: https://openmoji.org/
[10]: https://creativecommons.org/licenses/by-sa/4.0/#
[11]: hyper://977da6c3040f711508fe246a22b1a1ddd5b716b16dc9ad2a744383d91d52b63a/
