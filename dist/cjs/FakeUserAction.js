"use strict";
// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols,PointlessArithmeticExpressionJS
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeUserAction = void 0;
const assert_1 = require("assert");
const helper_1 = require("./helper");
const PptrToolkit_1 = require("./PptrToolkit");
class FakeUserAction {
    constructor(fb) {
        this._mouseCurrPos = { x: helper_1.helper.rd(0, 1280), y: helper_1.helper.rd(0, 700) };
        this._fakeBrowser = new WeakRef(fb);
    }
    /**
     * Fake mouse movement track
     * @param startPos
     * @param endPos
     * @param maxPoints
     * @param cpDelta
     */
    static mouseMovementTrack(startPos, endPos, maxPoints = 30, cpDelta = 1) {
        // reference: https://github.com/mtsee/Bezier/blob/master/src/bezier.js
        let nums = [];
        let maxNum = 0;
        let moveStep = 1;
        // Simulates the user's mouse movement acceleration / constant speed / deceleration
        for (let n = 0; n < maxPoints; ++n) {
            nums.push(maxNum);
            // noinspection PointlessArithmeticExpressionJS
            if (n < maxPoints * 1 / 10) {
                moveStep += helper_1.helper.rd(60, 100);
            }
            else if (n >= maxPoints * 9 / 10) {
                moveStep -= helper_1.helper.rd(60, 100);
                moveStep = Math.max(20, moveStep);
            }
            maxNum += moveStep;
        }
        const result = [];
        const p1 = [
            startPos.x,
            startPos.y,
        ];
        const cp1 = [
            (startPos.x + endPos.x) / 2 + helper_1.helper.rd(30, 100, true) * cpDelta,
            (startPos.y + endPos.y) / 2 + helper_1.helper.rd(30, 100, true) * cpDelta,
        ];
        const cp2 = [
            (startPos.x + endPos.x) / 2 + helper_1.helper.rd(30, 100, true) * cpDelta,
            (startPos.y + endPos.y) / 2 + helper_1.helper.rd(30, 100, true) * cpDelta,
        ];
        const p2 = [
            endPos.x,
            endPos.y,
        ];
        for (let num of nums) {
            const [x, y] = helper_1.helper.threeBezier(num / maxNum, p1, cp1, cp2, p2);
            result.push({ x, y });
        }
        return result;
    }
    /**
     * Simulate mouse movement
     * @param page
     * @param options
     */
    static async simMouseMove(page, options) {
        const points = this.mouseMovementTrack(options.startPos, options.endPos, options.maxPoints || helper_1.helper.rd(15, 30), options.cpDelta || 1);
        for (let n = 0; n < points.length; n += 1) {
            const point = points[n];
            await page.mouse.move(point.x, point.y, { steps: helper_1.helper.rd(1, 2) });
            await helper_1.helper.sleep((options.timestamp || helper_1.helper.rd(300, 800)) / points.length);
        }
    }
    get fakeBrowser() {
        // @ts-ignore
        if (!this._fakeBrowser || this._fakeBrowser._zombie) {
            return null;
        }
        const fb = this._fakeBrowser.deref();
        if (!fb) {
            this._fakeBrowser = null;
            return null;
        }
        return fb;
    }
    async simMouseMoveTo(endPos, maxPoints, timestamp, cpDelta) {
        const fb = this.fakeBrowser;
        if (!fb) {
            return false;
        }
        if (fb.isMobileBrowser) {
            // We don't need to simulate mouse slide.
            await helper_1.helper.sleepRd(300, 800);
            return true;
        }
        // Get the current page of the browser
        const currPage = await fb.getActivePage();
        (0, assert_1.strict)(currPage);
        // first move to a close position, then finally move to the target position
        const closeToEndPos = {
            x: endPos.x + helper_1.helper.rd(5, 30, true),
            y: endPos.y + helper_1.helper.rd(5, 20, true),
        };
        await FakeUserAction.simMouseMove(currPage, {
            startPos: this._mouseCurrPos,
            endPos: closeToEndPos,
            maxPoints,
            timestamp,
            cpDelta,
        });
        // The last pos must correction
        await currPage.mouse.move(endPos.x, endPos.y, { steps: helper_1.helper.rd(5, 13) });
        this._mouseCurrPos = endPos;
        return true;
    }
    async simRandomMouseMove() {
        const fb = this.fakeBrowser;
        if (!fb) {
            return false;
        }
        if (fb.isMobileBrowser) {
            // We don't need to simulate mouse slide.
            await helper_1.helper.sleepRd(200, 500);
            return true;
        }
        const fakeDD = fb.driverParams.fakeDeviceDesc;
        (0, assert_1.strict)(fakeDD);
        const innerWidth = fakeDD.window.innerWidth;
        const innerHeight = fakeDD.window.innerHeight;
        // -----------------
        // |      1/6      |
        // | 1/4      1/4  |
        // |      1/6      |
        // -----------------
        const startX = innerWidth / 4;
        const startY = innerHeight / 6;
        const endX = innerWidth * 3 / 4;
        const endY = innerHeight * 5 / 6;
        const endPos = { x: helper_1.helper.rd(startX, endX), y: helper_1.helper.rd(startY, endY) };
        await this.simMouseMoveTo(endPos);
        await helper_1.helper.sleepRd(300, 800);
        return true;
    }
    async simClick(options = {
        pauseAfterMouseUp: true,
    }) {
        const fb = this.fakeBrowser;
        if (!fb) {
            return false;
        }
        const currPage = await fb.getActivePage();
        (0, assert_1.strict)(currPage);
        if (fb.isMobileBrowser) {
            // We can't use mouse obj, we have to use touchscreen
            await currPage.touchscreen.tap(this._mouseCurrPos.x, this._mouseCurrPos.y);
        }
        else {
            await currPage.mouse.down();
            await helper_1.helper.sleepRd(30, 80);
            await currPage.mouse.up();
        }
        if (options && options.pauseAfterMouseUp) {
            await helper_1.helper.sleepRd(150, 600);
        }
        return true;
    }
    async simMoveToAndClick(endPos, options = {
        pauseAfterMouseUp: true,
    }) {
        const fb = this.fakeBrowser;
        if (!fb) {
            return false;
        }
        const currPage = await fb.getActivePage();
        (0, assert_1.strict)(currPage);
        if (!fb.isMobileBrowser) {
            await this.simMouseMoveTo(endPos);
            await currPage.mouse.move(endPos.x + helper_1.helper.rd(-10, 10), endPos.y, { steps: helper_1.helper.rd(8, 20) });
        }
        this._mouseCurrPos = endPos;
        await helper_1.helper.sleepRd(300, 800);
        return this.simClick(options);
    }
    async simMouseMoveToElement(eh) {
        const fb = this.fakeBrowser;
        if (!fb) {
            return false;
        }
        const fakeDD = fb.driverParams.fakeDeviceDesc;
        (0, assert_1.strict)(fakeDD);
        const currPage = await fb.getActivePage();
        (0, assert_1.strict)(currPage);
        let box;
        if (fb.isMobileBrowser) {
            box = await FakeUserAction.adjustElementPositionWithTouchscreen(eh, currPage, fakeDD);
        }
        else {
            box = await FakeUserAction.adjustElementPositionWithMouse(eh, currPage, fakeDD);
        }
        if (box) {
            // The position of each element click should not be the center of the element
            // size of the clicked element must larger than 10 x 10
            const endPos = {
                x: box.x + box.width / 2 + helper_1.helper.rd(0, 5, true),
                y: box.y + box.height / 2 + helper_1.helper.rd(0, 5, true),
            };
            await this.simMouseMoveTo(endPos);
            // Pause
            await helper_1.helper.sleepRd(300, 800);
            return true;
        }
        return false;
    }
    async simClickElement(eh, options = {
        pauseAfterMouseUp: true,
    }) {
        const moveToEl = await this.simMouseMoveToElement(eh);
        if (!moveToEl) {
            return false;
        }
        // click
        if (await this.simClick(options)) {
            return true;
        }
        else {
            return false;
        }
    }
    static async adjustElementPositionWithMouse(eh, currPage, fakeDD) {
        let box = null;
        for (;;) {
            box = await PptrToolkit_1.PptrToolkit.boundingBox(eh);
            if (box) {
                // Check the node is in the visible area
                // @ts-ignore
                let deltaX = 0;
                let deltaY = 0;
                let viewportAdjust = false;
                // If the top of the node is less than 0
                if (box.y <= 0) {
                    // deltaY always positive
                    // ---------------------
                    //     30px           |
                    //    [   ]           |
                    // ..         Distance to be moved
                    // ..                 |
                    // ..                 |
                    // ---------------------body top
                    deltaY = Math.min(-(box.y - 30) - 0, helper_1.helper.rd(150, 300));
                    deltaY = -deltaY;
                    viewportAdjust = true;
                }
                else if (box.y + box.height >= fakeDD.window.innerHeight) {
                    // If the bottom is beyond
                    deltaY = Math.min(box.y + box.height + 30 - fakeDD.window.innerHeight, helper_1.helper.rd(150, 300));
                    viewportAdjust = true;
                }
                // if (box.x <= 0) {
                //     // If the top of the button is less than 0
                //     deltaX = Math.min(-box.x + 30, sh.rd(100, 400))
                //     deltaX = -deltaX
                //     viewportAdjust = true
                // } else if (box.x + box.width >= fakeDD.window.innerWidth) {
                //     // If the bottom is beyond
                //     deltaX = Math.min(box.x + box.width - fakeDD.window.innerWidth + 30, sh.rd(100, 400))
                //     viewportAdjust = true
                // }
                if (viewportAdjust) {
                    // await currPage.mouse.wheel({deltaX})
                    await currPage.mouse.wheel({ deltaY });
                    await helper_1.helper.sleepRd(100, 400);
                }
                else {
                    break;
                }
            }
            else {
                break;
            }
        }
        return box;
    }
    static async adjustElementPositionWithTouchscreen(eh, currPage, fakeDD) {
        let box = null;
        for (;;) {
            box = await PptrToolkit_1.PptrToolkit.boundingBox(eh);
            if (box) {
                // @ts-ignore
                let deltaX = 0;
                let deltaY = 0;
                let viewportAdjust = false;
                if (box.y <= 0) {
                    deltaY = Math.min(-box.y + 30, helper_1.helper.rd(100, 300));
                    deltaY = -deltaY;
                    viewportAdjust = true;
                }
                else if (box.y + box.height >= fakeDD.window.innerHeight) {
                    deltaY = Math.min(box.y + box.height - fakeDD.window.innerHeight + 30, helper_1.helper.rd(100, 300));
                    viewportAdjust = true;
                }
                if (viewportAdjust) {
                    // noinspection TypeScriptValidateTypes
                    const _patchTouchscreenDesc = Object.getOwnPropertyDescriptor(currPage, '_patchTouchscreen');
                    (0, assert_1.strict)(_patchTouchscreenDesc);
                    const touchscreen = _patchTouchscreenDesc.value;
                    (0, assert_1.strict)(touchscreen);
                    // if deltaY is negative, drop down, otherwise drop up
                    const startX = fakeDD.window.innerWidth / 2 + helper_1.helper.rd(0, fakeDD.window.innerWidth / 6);
                    const endX = fakeDD.window.innerWidth / 2 + helper_1.helper.rd(0, fakeDD.window.innerWidth / 6);
                    let startY;
                    let endY;
                    if (deltaY < 0) {
                        startY = helper_1.helper.rd(0, fakeDD.window.innerHeight - (-deltaY));
                        endY = startY + deltaY;
                    }
                    else {
                        startY = helper_1.helper.rd(deltaY, fakeDD.window.innerHeight);
                        endY = startY - deltaY;
                    }
                    await touchscreen.drag({
                        x: startX, y: startY,
                    }, {
                        x: endX, y: endY,
                    });
                    await helper_1.helper.sleepRd(100, 300);
                }
                else {
                    break;
                }
            }
            else {
                break;
            }
        }
        return box;
    }
    async simKeyboardPress(text, options = {
        pauseAfterKeyUp: true,
    }) {
        const fb = this.fakeBrowser;
        if (!fb) {
            return false;
        }
        const currPage = await fb.getActivePage();
        (0, assert_1.strict)(currPage);
        await currPage.keyboard.press(text);
        if (options && options.pauseAfterKeyUp) {
            await helper_1.helper.sleepRd(300, 1000);
        }
        return true;
    }
    async simKeyboardEnter(options = {
        pauseAfterKeyUp: true,
    }) {
        return await this.simKeyboardPress('Enter', options);
    }
    async simKeyboardEsc(options = {
        pauseAfterKeyUp: true,
    }) {
        return await this.simKeyboardPress('Escape', options);
    }
    async simKeyboardType(text, options = {
        pauseAfterLastKeyUp: true,
    }) {
        const fb = this.fakeBrowser;
        if (!fb) {
            return false;
        }
        const currPage = await fb.getActivePage();
        (0, assert_1.strict)(currPage);
        const needsShiftKey = '~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:"ZXCVBNM<>?';
        // TODO: check if shiftKey, alt, ctrl can be fired in mobile browsers
        for (let ch of text) {
            let needsShift = false;
            if (needsShiftKey.includes(ch)) {
                needsShift = true;
                await currPage.keyboard.down('ShiftLeft');
                await helper_1.helper.sleepRd(500, 1000);
            }
            // if a Chinese character
            const isCh = ch.match(/^[\u4e00-\u9fa5]/);
            const delay = isCh ? helper_1.helper.rd(200, 800) : helper_1.helper.rd(30, 100);
            await currPage.keyboard.type('' + ch, { delay });
            if (needsShift) {
                await helper_1.helper.sleepRd(150, 450);
                await currPage.keyboard.up('ShiftLeft');
            }
            await helper_1.helper.sleepRd(30, 100);
        }
        if (options && options.pauseAfterLastKeyUp) {
            await helper_1.helper.sleepRd(300, 1000);
        }
        return true;
    }
}
exports.FakeUserAction = FakeUserAction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmFrZVVzZXJBY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29yZS9GYWtlVXNlckFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMEZBQTBGOzs7QUFFMUYsbUNBQXVDO0FBSXZDLHFDQUErQjtBQUUvQiwrQ0FBeUM7QUFJekMsTUFBYSxjQUFjO0lBTXZCLFlBQVksRUFBZTtRQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUMsQ0FBQyxFQUFFLGVBQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxlQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBQyxDQUFBO1FBQ2xFLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxPQUFPLENBQWMsRUFBRSxDQUFDLENBQUE7SUFDcEQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNLLE1BQU0sQ0FBQyxrQkFBa0IsQ0FDN0IsUUFBZSxFQUNmLE1BQWEsRUFDYixTQUFTLEdBQUcsRUFBRSxFQUNkLE9BQU8sR0FBRyxDQUFDO1FBRVgsdUVBQXVFO1FBRXZFLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQTtRQUNiLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQTtRQUNkLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQTtRQUVoQixtRkFBbUY7UUFDbkYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRTtZQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRWpCLCtDQUErQztZQUMvQyxJQUFJLENBQUMsR0FBRyxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDeEIsUUFBUSxJQUFJLGVBQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFBO2FBQ2pDO2lCQUFNLElBQUksQ0FBQyxJ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