function Term(id, width, height) {
  this.screen_width = width;
  this.screen_height = height;
  this.cursor_x = 0;
  this.cursor_y = 0;
  this.escape_mode = 0;
  this.escape_code = "";
  this.null_line = "";

  this.frame_div = document.getElementById(id);
  this.frame_pre = document.createElement('pre');
  this.frame_div.appendChild(this.frame_pre);

  for (var x = 0; x < width; x++)
    this.null_line += " ";
  this.null_line += "\n";

  for (var y = 0; y < height; y++) {
    this.frame_pre.appendChild(document.createTextNode(this.null_line));
  }

  this.updateLine = function (line, s) {
    this.frame_pre.childNodes[line].nodeValue = s;
  }

  this.clearScreen = function () {
    for (var y = 0; y < this.screen_height; y++)
      this.updateLine(y, this.null_line);
    this.setCursorPosition(0, 0);
  }

  this.setCursorPosition = function (x, y) {
    this.cursor_x = x;
    this.cursor_y = y;
    if (x >= this.screen_width) {
      this.cursor_x = this.screen_width;
      //console.log("invalid X position: " + x);
    }
    if (y >= this.screen_height) {
      this.cursor_y = this.screen_height;
      //console.log("invalid Y position: " + y);
    }
  }

  this.appendEnter = function () {
    this.cursor_x = 0;
    this.cursor_y++;
    if (this.cursor_y == this.screen_height) {
      this.cursor_y--;
      this.frame_pre.removeChild(this.frame_pre.firstChild);
      this.frame_pre.appendChild(document.createTextNode(this.null_line));
    }
  }

  this.appendCharacter = function (c) {
    if (0 != this.escape_mode) {
      this.escape_code += c;
      if (this.escape_code == "[2J") {
        this.escape_mode = 0;
        this.clearScreen();
        //console.log("^" + this.escape_code + " ... clear screen");
        return;
      } else if (c == "H") {
        this.escape_mode = 0;
        var code = this.escape_code.substr(1, this.escape_code.length - 2);
        pos = code.split(";");
        var x = Number(pos[1]);
        var y = Number(pos[0]);
	this.setCursorPosition(x, y);
        //console.log("^" + this.escape_code + " ... set cursor position to (" + x +
        //    "," + y + ")");
      }
      if (this.escape_code.length == 16) {
        this.escape_mode = 0;
        console.log("unknown escape sequence: ^" + this.escape_code);
        this.appendCharacter(this.escape_code.substr(1));
      }
      return;
    }
    switch (c.charCodeAt(0)) {
    case 0x08:
      if (0 != this.cursor_x) {
          this.cursor_x--;
          this.appendCharacter(' ');
          this.cursor_x--;
      }
      return;
    case 0x0a:
      this.appendEnter();
      // no break
    case 0x0d:
      this.cursor_x = 0;
      return;
    case 0x1b:
      this.escape_mode = 1;
      this.escape_code = "";
      return;
    }
    if (this.screen_width == this.cursor_x)
      this.appendEnter();
    var old_line = this.frame_pre.childNodes[this.cursor_y].nodeValue;
    var new_line = "";
    if (0 != this.cursor_x)
      new_line = old_line.substr(0, this.cursor_x);
    new_line += c;
    new_line += old_line.substr(this.cursor_x + 1,
                                this.screen_width - this.cursor_x);
    this.updateLine(this.cursor_y, new_line);

    this.cursor_x++;
  }

  this.appendString = function (s) {
    for (var i = 0; i < s.length; i++) {
      this.appendCharacter(s.charAt(i));
    }
  }

  this.dumpKeyEvent = function (name, e) {
    var msg = name + ": " + e.which + ",key(" + e.keyCode + "), char(" +
        e.charCode + "), [" + (event.altKey ? "A" : " ") +
        (event.ctrlKey ? "C" : " ") + (event.shiftKey ? "S" : " ") + "]";
        console.log(msg);
  }

  this.onKeyDown = function (e) {
    this.dumpKeyEvent("keydown ", e);
  }

  this.onKeyPress = function (e) {
    this.dumpKeyEvent("keypress", e);
    this.appendCharacter(String.fromCharCode(e.which));
  }

  this.onKeyUp = function (e) {
    this.dumpKeyEvent("keyup   ", e);
  }
}
