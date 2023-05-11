// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols,PointlessArithmeticExpressionJS
import { strict as assert } from 'assert';
import { helper } from './helper';
import { PptrToolkit } from './PptrToolkit';
export class FakeUserAction {
    constructor(fb) {
        this._mouseCurrPos = { x: helper.rd(0, 1280), y: helper.rd(0, 700) };
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
                moveStep += helper.rd(60, 100);
            }
            else if (n >= maxPoints * 9 / 10) {
                moveStep -= helper.rd(60, 100);
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
            (startPos.x + endPos.x) / 2 + helper.rd(30, 100, true) * cpDelta,
            (startPos.y + endPos.y) / 2 + helper.rd(30, 100, true) * cpDelta,
        ];
        const cp2 = [
            (startPos.x + endPos.x) / 2 + helper.rd(30, 100, true) * cpDelta,
            (startPos.y + endPos.y) / 2 + helper.rd(30, 100, true) * cpDelta,
        ];
        const p2 = [
            endPos.x,
            endPos.y,
        ];
        for (let num of nums) {
            const [x, y] = helper.threeBezier(num / maxNum, p1, cp1, cp2, p2);
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
        const points = this.mouseMovementTrack(options.startPos, options.endPos, options.maxPoints || helper.rd(15, 30), options.cpDelta || 1);
        for (let n = 0; n < points.length; n += 1) {
            const point = points[n];
            await page.mouse.move(point.x, point.y, { steps: helper.rd(1, 2) });
            await helper.sleep((options.timestamp || helper.rd(300, 800)) / points.length);
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
            await helper.sleepRd(300, 800);
            return true;
        }
        // Get the current page of the browser
        const currPage = await fb.getActivePage();
        assert(currPage);
        // first move to a close position, then finally move to the target position
        const closeToEndPos = {
            x: endPos.x + helper.rd(5, 30, true),
            y: endPos.y + helper.rd(5, 20, true),
        };
        await FakeUserAction.simMouseMove(currPage, {
            startPos: this._mouseCurrPos,
            endPos: closeToEndPos,
            maxPoints,
            timestamp,
            cpDelta,
        });
        // The last pos must correction
        await currPage.mouse.move(endPos.x, endPos.y, { steps: helper.rd(5, 13) });
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
            await helper.sleepRd(200, 500);
            return true;
        }
        const fakeDD = fb.driverParams.fakeDeviceDesc;
        assert(fakeDD);
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
        const endPos = { x: helper.rd(startX, endX), y: helper.rd(startY, endY) };
        await this.simMouseMoveTo(endPos);
        await helper.sleepRd(300, 800);
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
        assert(currPage);
        if (fb.isMobileBrowser) {
            // We can't use mouse obj, we have to use touchscreen
            await currPage.touchscreen.tap(this._mouseCurrPos.x, this._mouseCurrPos.y);
        }
        else {
            await currPage.mouse.down();
            await helper.sleepRd(30, 80);
            await currPage.mouse.up();
        }
        if (options && options.pauseAfterMouseUp) {
            await helper.sleepRd(150, 600);
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
        assert(currPage);
        if (!fb.isMobileBrowser) {
            await this.simMouseMoveTo(endPos);
            await currPage.mouse.move(endPos.x + helper.rd(-10, 10), endPos.y, { steps: helper.rd(8, 20) });
        }
        this._mouseCurrPos = endPos;
        await helper.sleepRd(300, 800);
        return this.simClick(options);
    }
    async simMouseMoveToElement(eh) {
        const fb = this.fakeBrowser;
        if (!fb) {
            return false;
        }
        const fakeDD = fb.driverParams.fakeDeviceDesc;
        assert(fakeDD);
        const currPage = await fb.getActivePage();
        assert(currPage);
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
                x: box.x + box.width / 2 + helper.rd(0, 5, true),
                y: box.y + box.height / 2 + helper.rd(0, 5, true),
            };
            await this.simMouseMoveTo(endPos);
            // Pause
            await helper.sleepRd(300, 800);
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
            box = await PptrToolkit.boundingBox(eh);
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
                    deltaY = Math.min(-(box.y - 30) - 0, helper.rd(150, 300));
                    deltaY = -deltaY;
                    viewportAdjust = true;
                }
                else if (box.y + box.height >= fakeDD.window.innerHeight) {
                    // If the bottom is beyond
                    deltaY = Math.min(box.y + box.height + 30 - fakeDD.window.innerHeight, helper.rd(150, 300));
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
                    await helper.sleepRd(100, 400);
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
            box = await PptrToolkit.boundingBox(eh);
            if (box) {
                // @ts-ignore
                let deltaX = 0;
                let deltaY = 0;
                let viewportAdjust = false;
                if (box.y <= 0) {
                    deltaY = Math.min(-box.y + 30, helper.rd(100, 300));
                    deltaY = -deltaY;
                    viewportAdjust = true;
                }
                else if (box.y + box.height >= fakeDD.window.innerHeight) {
                    deltaY = Math.min(box.y + box.height - fakeDD.window.innerHeight + 30, helper.rd(100, 300));
                    viewportAdjust = true;
                }
                if (viewportAdjust) {
                    // noinspection TypeScriptValidateTypes
                    const _patchTouchscreenDesc = Object.getOwnPropertyDescriptor(currPage, '_patchTouchscreen');
                    assert(_patchTouchscreenDesc);
                    const touchscreen = _patchTouchscreenDesc.value;
                    assert(touchscreen);
                    // if deltaY is negative, drop down, otherwise drop up
                    const startX = fakeDD.window.innerWidth / 2 + helper.rd(0, fakeDD.window.innerWidth / 6);
                    const endX = fakeDD.window.innerWidth / 2 + helper.rd(0, fakeDD.window.innerWidth / 6);
                    let startY;
                    let endY;
                    if (deltaY < 0) {
                        startY = helper.rd(0, fakeDD.window.innerHeight - (-deltaY));
                        endY = startY + deltaY;
                    }
                    else {
                        startY = helper.rd(deltaY, fakeDD.window.innerHeight);
                        endY = startY - deltaY;
                    }
                    await touchscreen.drag({
                        x: startX, y: startY,
                    }, {
                        x: endX, y: endY,
                    });
                    await helper.sleepRd(100, 300);
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
        assert(currPage);
        await currPage.keyboard.press(text);
        if (options && options.pauseAfterKeyUp) {
            await helper.sleepRd(300, 1000);
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
        assert(currPage);
        const needsShiftKey = '~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:"ZXCVBNM<>?';
        // TODO: check if shiftKey, alt, ctrl can be fired in mobile browsers
        for (let ch of text) {
            let needsShift = false;
            if (needsShiftKey.includes(ch)) {
                needsShift = true;
                await currPage.keyboard.down('ShiftLeft');
                await helper.sleepRd(500, 1000);
            }
            // if a Chinese character
            const isCh = ch.match(/^[\u4e00-\u9fa5]/);
            const delay = isCh ? helper.rd(200, 800) : helper.rd(30, 100);
            await currPage.keyboard.type('' + ch, { delay });
            if (needsShift) {
                await helper.sleepRd(150, 450);
                await currPage.keyboard.up('ShiftLeft');
            }
            await helper.sleepRd(30, 100);
        }
        if (options && options.pauseAfterLastKeyUp) {
            await helper.sleepRd(300, 1000);
        }
        return true;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmFrZVVzZXJBY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29yZS9GYWtlVXNlckFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRkFBMEY7QUFFMUYsT0FBTyxFQUFDLE1BQU0sSUFBSSxNQUFNLEVBQUMsTUFBTSxRQUFRLENBQUE7QUFJdkMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFVBQVUsQ0FBQTtBQUUvQixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFBO0FBSXpDLE1BQU0sT0FBTyxjQUFjO0lBTXZCLFlBQVksRUFBZTtRQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBQyxDQUFBO1FBQ2xFLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxPQUFPLENBQWMsRUFBRSxDQUFDLENBQUE7SUFDcEQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNLLE1BQU0sQ0FBQyxrQkFBa0IsQ0FDN0IsUUFBZSxFQUNmLE1BQWEsRUFDYixTQUFTLEdBQUcsRUFBRSxFQUNkLE9BQU8sR0FBRyxDQUFDO1FBRVgsdUVBQXVFO1FBRXZFLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQTtRQUNiLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQTtRQUNkLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQTtRQUVoQixtRkFBbUY7UUFDbkYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRTtZQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRWpCLCtDQUErQztZQUMvQyxJQUFJLENBQUMsR0FBRyxTQUFTLEdBQUcsQ0FBQyxHQUFH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