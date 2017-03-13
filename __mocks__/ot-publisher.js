function Publisher() {
    this.destroy = function() { console.log("Publisher destroyed"); };
    this.on = function() { }
}

module.exports = Publisher;
