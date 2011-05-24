/**
 * CP/M for JavaScript
 */
function CPM (console, disk)
{
    this.console = console;
    this.esc = 0;
    this.disk = new Uint8Array(disk);
    this.ram = new Uint8Array(65536);

    this.superclass = Z80;
    this.superclass(3.58);

    this.out("Z80 Emulation Engine from jsMSX - MSX Emulator in JavaScript\n");
    this.out("  Copyright (c) 2006 Marcus Granado <mrc.gran(@)gmail.com>\n");
    this.out("CP/M Emulator in JavaScript\n")
    this.out("  Copyright (c) 2011 Takashi Toyoshima <toyoshim(@)gmail.com>\n\n");
    this.out("A: " + this.disk.byteLength + " Bytes\n");
    this.out("RAM: " + this.ram.byteLength + " Bytes\n");

    var iplSize = 13 * 512;
    var baseAddress = 0xe380;
    for (var i = 0; i < iplSize; i++) {
        this.ram[baseAddress + i] = this.disk[i];
    }
    for (var i = 0; i < 0x100; i++)
        this.ram[i] = 0;
    this.ram[0x0005] = 0xc3;
    this.ram[0x0006] = 0x06;
    this.ram[0x0007] = 0x3c + 0xb0;

    this.inb = function (addr) {
        switch (addr) {
        case 0: // check keyboard
            if (this.console.ready())
                return 0xff; // ready
            return 0;
        case 1: // read character from keyboard
            var result = this.console.input();
            if (result == -1) throw 0;
            return result;
        case 14:
            return 0;
        default:
            this.log("IN " + addr);
            this.stop = true;
            return 0xff;
        }
    };

    this.outb = function (addr, data) {
        switch (addr) {
        case 1: // write character to console
            switch (this.esc) {
            case 1:
                if (0x3d == data) { /* '=' */
                    this.esc = 2;
                } else if (0x3b == data) { /* ';' */
                    this.out("\x1b[2J");
                    this.esc = 0;
                } else {
                    this.esc = 0;
                }
                break;
            case 2:
                this.out("\x1b[");
                this.out((data - 0x20 + 1).toString());
                this.esc = 3;
                break;
            case 3:
                this.out(";");
                this.out((data - 0x20 + 1).toString());
                this.out("H");
                this.esc = 0;
                break;
            case 0:
                if (0x1a == data) {
                    this.out("\x1b[2J");
                } else if (0x1b == data) {
                    this.esc = 1;
                } else {
                    this.out(String.fromCharCode(data));
                }
                break;
            }
            break;
        case 10: // set target drive
            this.drive = data;
            this.log("select drive: " + data);
            break;
        case 11: // set target track
            this.track = data;
            this.log("select track: " + data);
            break;
        case 12: // set target sector
            this.sector = data;
            this.log("select sector: " + data);
            break;
        case 13: // do disk I/O
            var pos = (this.track * 26 + this.sector - 1) * 128;
            var dma = (this.dmaHigh << 8) | this.dmaLow;
            if (0 == data) {
                this.log("disk read");
                for (var i = 0; i < 128; i++)
                    this.ram[dma + i] = this.disk[pos + i];
            } else {
                this.log("disk write");
                for (var i = 0; i < 128; i++)
                    this.disk[pos + i] = this.ram[dma + i];
            }
            break;
        case 15: // set dma address low
            this.dmaLow = data;
            this.log("set dma address low: " + data);
            break;
        case 16: // set dma address high
            this.dmaHigh = data;
            this.log("set dma address high: " + data);
            break;
        default:
            this.log("OUT " + addr + ", " + data);
            this.stop = true;
        }
    };

    this.peekb = function (addr) {
        return this.ram[addr];
    };

    this.pokeb = function (addr, data) {
        this.ram[addr] = data;
    };

    this.peekw = function (addr) {
        return (this.peekb(addr + 1) << 8) | this.peekb(addr);
    };

    this.pokew = function (addr, data) {
        this.pokeb(addr + 0, data & 0xff);
        this.pokeb(addr + 1, (data >> 8) & 0xff);
    };

    this.interrupt = function () {
//        this.log("INTERRUPT: " + this._PC);
        return 0;
    };
}

CPM.prototype.out = function (message) {
    if (this.stop) return;
    for (var i = 0; i < message.length; i++) {
        this.console.output(message[i]);
    }
};

CPM.prototype.log = function (obj) {
    console.log(obj);
};
