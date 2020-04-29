/*
 * Miscellaneous common functions
 */

function getUniqueID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};


// shuffle between array[start:end], inclusive
function shuffleSubArray(array, start, end) {
    var m = end - start + 1, t, i;

    if (m <= 1) return; // nothing to do here
  
    // While there remain elements to shuffle…
    while (m) {
  
      // Pick a remaining element…
      i = start + Math.floor(Math.random() * m--);
  
      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
}


module.exports = {
    getUniqueID,
    shuffleSubArray,
}  
