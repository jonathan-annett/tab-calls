    function globalsVarProxy (key) {return globs[key];}
    globalsVarProxy.keys = function () {
        return Object.keys(globs);
    };
