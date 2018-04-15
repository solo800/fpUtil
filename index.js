var fpUtil = (function () {

    // General purpose helpers
    // Type, return the type of the passed in object
    var tp = function (e) {
        return Object.prototype.toString.call(e);
    },
    // Check Type, return true or false if the type string passed in is similar to the type of the passed in object
    ctp = function (e, type) {
        // slice(8) removes "[object " from the type string
        if ('[object String]' !== tp(type)) return false;
        return tp(e).slice(8).toLowerCase().indexOf(type.toLowerCase()) > -1;
    },
    ctpFull = function (e, type) {
        if ('[object String]' !== tp(type)) return false;
        return tp(e) === type || tp(e).toLowerCase() === type.toLowerCase();
    },
    // Parse JSON or return an empty obect
    parseJ = function (str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return {};
        }
    },
    // Split string into segments
    chunkStr = function (str, size) {
        if (str.length <= size) {
            return [str];
          }

      var chunks = [],
          chunk,
          strArr = str.replace(/\s/g, '').split('');

      while(0 < strArr.length) {
        chunk = strArr.splice(0, 3);
        if (chunk.length === size) {
          chunks.push(chunk.join(''));
        }
      }
      return chunks;
    },
    // Format numbers with commas
    frmNum = function (num, dec) {
      if (isNaN(parseInt(num))) {
        return 0;
      }
      var sArr = String(num).replace(',', '').split('.'),
        frmNum = sArr[0];

      // Deal with decimals
      return frmNumAddDec(frmNum, dec, sArr) * 1;
    },
    // Reduce an array of objects based on a single property of each object
    reduceByProp = function (arr, prop, start) {
        start = ctp(start, 'number') ? start : 0;

        return arr.reduce(function (prev, next) {
            if ('undefined' !== typeof next[prop]) {
                return prev + next[prop] * 1;
            } else if ('undefined' !== typeof next.db[prop]) {
                return prev + next.db[prop] * 1;
            }
        }, start);
    },
    isNum = function (num) {
        return !isNaN(num);
    },
    copyObject = function (object) {
        var copy = {};

        for (var prop in object) {
            if (object.hasOwnProperty(prop)) {
                if (ctp(object[prop], 'array')) {
                    copy[prop] = object[prop].slice(0);
                } else if (ctpFull(object[prop], '[object Object]')) {
                    copy[prop] = copyObject(object[prop]);
                } else {
                    copy[prop] = object[prop];
                }
            }
        }

        return copy;
    },

    // Date helpers
    dateHelpers = function () {
        var today = function () {
            var date = new Date();

            return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
        };

        return {
            today: today
        };
    },

    // Text helpers


    // Special chars with accents and umlauts and what not
    specialCharacters = function () {
        var translate = function (str, kwargs) {
            if ('[object String]' === Object.prototype.toString.call(str)) {
                var newS = '',
                    sArr = str.split(''),
                    type,
                    defArgs = {
                        type: 'accents',
                        special: []
                    },
                    args,
                    $this = this;

                if ('[object Object]' === Object.prototype.toString.call(kwargs)) {
                    args = {
                        type: 'undefined' === typeof kwargs.type ? 'accents' : kwargs.type,
                        /*
                         * special chars works by string index
                         * 'adam' would become 'adám' with...
                         * special = [2]
                         */
                        special: 'undefined' === typeof kwargs.special ? [] : kwargs.special,
                    };
                } else {
                    args = defArgs;
                }

                // Ensure valid types are passed
                if ('undefined' === typeof args.type) {
                    type = 'accents';
                } else {
                    type = args.type;
                }
                if ('[object Array]' !== Object.prototype.toString.call(args.special)) {
                    args.special = [];
                }

                // End valid type checking
                var specialized;
                sArr.forEach(function (s, i) {
                    specialized = false;
                    if (0 < args.special.length) {
                        specialized = true;
                        if (-1 < args.special.indexOf(i)) {
                            newS += 'undefined' !== typeof $this[type][s] ? $this[type][s] : s;
                        } else {
                            newS += s;
                        }
                    }

                    if (false === specialized) {
                        newS += 'undefined' !== typeof $this[type][s] ? $this[type][s] : s;
                    }
                });
                return newS;
            }
        },
        removeSpecialChars = function (str) {
            if (!ctp(str, 'string')) {
                return str;
            }

            var $this = this,
                strArr = str.split(''),
                newS = '',
                normalized;

            strArr.forEach(function (char) {
                normalized = false;
                $this.revTypes.forEach(function (type) {
                    if ('undefined' !== typeof $this[type][char.toLowerCase()]) {
                        normalized = true;

                        // Check case
                        if (char.toLowerCase() === char) {
                            newS += $this[type][char.toLowerCase()];
                        } else {
                            newS += $this[type][char.toLowerCase()].toUpperCase();
                        }
                    } else if ('è' === char.toLowerCase()) {
                        normalized = true;

                        // Check case
                        newS += char.toLowerCase() === char ? 'e' : 'E';
                    } else if ('à' === char.toLowerCase()) {
                        normalized = true;

                        // Check case
                        newS += char.toLowerCase() === char ? 'a' : 'A';
                    }
                });
                if (false === normalized) {
                    newS += char;
                }
            });

            return newS;
        },
        buildPlayerBustFileName = function (player) {
            var $this = this,
                name = '';
            ['first_name', 'second_name'].forEach(function (prop) {
                name += $this.removeSpecialChars(player[prop]).replace(/\W/g, '').toLowerCase();
            });
            return name;
        },
        accents = {
            a: 'á',
            e: 'é',
            i: 'í',
            o: 'ó',
            u: 'ú'
        },
        tildes = {
            n: 'ñ'
        },
        umlauts = {
            u: 'ü',
            o: 'ö'
        },
        accentsRev = {},
        tildesRev = {},
        umlautsRev = {},
        types = ['accents', 'tildes', 'umlauts'],
        revTypes = ['accentsRev', 'tildesRev', 'umlautsRev'];

        function init () {
            for(var p in accents) {
                if (accents.hasOwnProperty(p)) {
                    accentsRev[accents[p]] = p;
                }
            }
            for(var p in tildes) {
                if (tildes.hasOwnProperty(p)) {
                    tildesRev[tildes[p]] = p;
                }
            }
            for(var p in umlauts) {
                if (umlauts.hasOwnProperty(p)) {
                    umlautsRev[umlauts[p]] = p;
                }
            }
        }
        init();

        return {
            translate: translate,
            removeSpecialChars: removeSpecialChars,
            rsChars: removeSpecialChars,
            buildPlayerBustFileName: buildPlayerBustFileName,
            accents: accents,
            tildes: tildes,
            umlauts: umlauts,
            accentsRev: accentsRev,
            tildesRev: tildesRev,
            umlautsRev: umlautsRev,
            types: types,
            revTypes: revTypes
        };
    },

    // DB helpers
    databaseHelpers = function () {
        var warn = function (err, connectionString) {
            console.warn('Error connecting to db');
            console.warn(err);
            console.log('connection string', connectionString);
        },
        log = function (msg) {
            console.log(msg);
        };
        return {
            warn: warn,
            log: log
        };
    },

    // Team helpers
    team = function () {
        // Public methods
        var log = function (players, properties, position) {
            var plrs;
            // _.each(players.positions, function (plrs, pos) {
            for (var pos in players.positions) {
                if (players.positions.hasOwnProperty(pos)) {
                    plrs = players.positions[pos];

                    console.log('Position:', pos, plrs.length, '*************************');

                    if (ctp(position, 'undefined')
                        || (false === ctp(position, 'undefined') && position === pos)) {

                        logPosition(plrs, properties);
                    } else {
                        console.log('skipping', pos);
                    }
                }
            }
            // });
        },
        logPosition = function (players, properties) {
            players.forEach(function (player) {
                if (ctp(player, 'array')) {
                    console.log('found sub array with', player.length, 'elements *****************');
                    logPosition(player, properties);
                } else {
                    console.log(buildPlayerLogString(player.web_name, player, properties));
                }
            });
        };

        // Private methods
        function buildPlayerLogString (startString, player, properties) {
            properties.forEach(function (prop) {
                startString += ', ' + prop + ': ' + player[prop];
            });

            return startString;
        }
        return {
            log: log,
            logPosition: logPosition
        };
    },

    // Stats helpers
    playerTypes = {
        obj: {
            'goalkeepers': 1,
            'defender': 2,
            'midfielders': 3,
            'forwards': 4
        },
        arr: [
            '',
            'goalkeepers',
            'defender',
            'midfielders',
            'forwards'
        ]
    };

    function frmNumAddDec (frmNum, dec, sArr) {
        if (!isNaN(parseInt(dec))) {
          if (0 < dec) {
            frmNum += '.';
            var man = '0';
            if ('undefined' !== typeof sArr[1]) {
              man = sArr[1];
            }

            for (var i = 0; i < dec; i++) {
              if ('undefined' !== typeof man[i]) {
                frmNum += man[i];
              } else {
                frmNum += 0;
              }
            }
          }
        }

        return frmNum;
    }

    return {
        tp: tp,
        ctp: ctp,
        ctpFull: ctpFull,
        chunkStr: chunkStr,
        parseJ: parseJ,
        frmNum: frmNum,
        isNum: isNum,
        copyObject: copyObject,
        reduceByProp: reduceByProp,

        // Deat helpers
        date: dateHelpers(),

        // Special characters
        sChars: specialCharacters(),
        specialCharacters: specialCharacters(),

        // DB helpers
        db: databaseHelpers(),

        // Team helpers
        team: team(),

        // Stats helpers
        playerTypes: playerTypes
    };
})();

module.exports = fpUtil;
