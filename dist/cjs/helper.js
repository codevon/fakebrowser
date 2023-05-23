"use strict";
// noinspection JSUnusedGlobalSymbols
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helper = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
function md5(data) {
    const md5 = crypto_1.default.createHash('md5');
    const result = md5.update(data).digest('hex');
    return result;
}
/**
 * setTimeout async wrapper
 * @param ms sleep timeout
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function sleepRd(a, b) {
    const rd = _rd(a, b);
    return sleep(rd);
}
/**
 * random method
 * @param min
 * @param max
 * @param pon random positive or negative
 */
function _rd(min, max, pon = false) {
    const c = max - min + 1;
    return Math.floor(Math.random() * c + min) * (pon ? _pon() : 1);
}
function _arrRd(arr) {
    if (!arr || !arr.length) {
        throw new TypeError('arr must not be empty');
    }
    return arr[_rd(0, arr.length - 1)];
}
/**
 * positive or negative
 */
function _pon() {
    return _rd(0, 10) >= 5 ? 1 : -1;
}
function inMac() {
    return process.platform == 'darwin';
}
function inLinux() {
    return process.platform == 'linux';
}
function inWindow() {
    return process.platform == 'win32';
}
async function waitFor(func, timeout) {
    let startTime = new Date().getTime();
    for (;;) {
        const result = await func();
        if (result) {
            return result;
        }
        if (new Date().getTime() - startTime > timeout) {
            return null;
        }
        await sleep(100);
    }
}
function myRealExportIP() {
    return new Promise((resolve, reject) => {
        axios_1.default.get('https://ifconfig.me/').then(response => {
            resolve(response.data);
        }).catch(ex => {
            reject(ex);
        });
    });
}
function arrShuffle(arr) {
    const result = arr.sort(() => 0.5 - Math.random());
    return result;
}
function objClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * @desc Second-order Bessel curves
 * @param {number} t Current Percentage
 * @param {Array} p1 Starting point coordinates
 * @param {Array} p2 End point coordinates
 * @param {Array} cp Control Points
 */
function twoBezier(t, p1, cp, p2) {
    const [x1, y1] = p1;
    const [cx, cy] = cp;
    const [x2, y2] = p2;
    let x = (1 - t) * (1 - t) * x1 + 2 * t * (1 - t) * cx + t * t * x2;
    let y = (1 - t) * (1 - t) * y1 + 2 * t * (1 - t) * cy + t * t * y2;
    return [x, y];
}
/**
 * @desc Third-order Bessel curves
 * @param {number} t Current Percentage
 * @param {Array} p1 Starting point coordinates
 * @param {Array} p2 End point coordinates
 * @param {Array} cp1 First Control Points
 * @param {Array} cp2 Second Control Points
 */
function threeBezier(t, p1, cp1, cp2, p2) {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [cx1, cy1] = cp1;
    const [cx2, cy2] = cp2;
    let x = x1 * (1 - t) * (1 - t) * (1 - t) +
        3 * cx1 * t * (1 - t) * (1 - t) +
        3 * cx2 * t * t * (1 - t) +
        x2 * t * t * t;
    let y = y1 * (1 - t) * (1 - t) * (1 - t) +
        3 * cy1 * t * (1 - t) * (1 - t) +
        3 * cy2 * t * t * (1 - t) +
        y2 * t * t * t;
    return [x, y];
}
function makeFuncName(len = 4) {
    let result = '';
    for (let n = 0; n < len; ++n) {
        result += String.fromCharCode(_rd(65, 132));
    }
    return result;
}
exports.helper = {
    md5,
    sleep,
    sleepRd,
    rd: _rd,
    arrRd: _arrRd,
    pon: _pon,
    inMac,
    inLinux,
    inWindow,
    waitFor,
    myRealExportIP,
    arrShuffle,
    objClone,
    twoBezier,
    threeBezier,
    makeFuncName,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvcmUvaGVscGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7Ozs7OztBQUVyQyxrREFBeUI7QUFDekIsb0RBQTJCO0FBRTNCLFNBQVMsR0FBRyxDQUFDLElBQVk7SUFDckIsTUFBTSxHQUFHLEdBQUcsZ0JBQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDcEMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7SUFFN0MsT0FBTyxNQUFNLENBQUE7QUFDakIsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsS0FBSyxDQUFDLEVBQVU7SUFDckIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUMxRCxDQUFDO0FBRUQsU0FBUyxPQUFPLENBQUMsQ0FBUyxFQUFFLENBQVM7SUFDakMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUNwQixPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUNwQixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEdBQUcsR0FBRyxLQUFLO0lBQzlDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFBO0lBQ3ZCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDbkUsQ0FBQztB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