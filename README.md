# tab-calls
-----------

Javascript library for calls between devices and tabs etc.

under development, use at own risk.

the only files you technically *need* from this repo (if you aren't contributing) are [tab-calls.js](/tab-calls.js) and [tab-pairing-setup.css](/tab-pairing-setup.css) and [tab-pairing-setup.html](tab-pairing-setup.html) - they must all live in the same folder

or you can use the following syntax in your project's package.json (this url points to a recent stable commit, you can omit the #commit-sha-hash for the latest bleeding edge commit)

    {
        "dependancies" : {
        "tab-calls": "github:jonathan-annett/tab-calls#6d820a846ecec5362a04330b04f40687bcba432a"
        }
    }


then require as follows


    const tabCalls = require("tab-calls"); 


there are a few dependancies that the above entry in package.json will pull in, see [package.json](/package.json) for specifics.

