/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019-2020 Future Internet Consulting and Development Solutions S.L.
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/* globals Wirecloud */


(function (utils) {

    "use strict";

    /**
     * @class Represents a dragboard layout to be used to place iwidgets into the dragboard.
     *
     * This dragobard uses percentages for horizontal units and px for vertical units.
     *
     * @extends Wirecloud.ui.DragboardLayout
     */
    var FreeLayout = function FreeLayout(dragboard) {
        this.initialized = false;
        this.iwidgetToMove = null;
        Wirecloud.ui.DragboardLayout.call(this, dragboard);
    };
    utils.inherit(FreeLayout, Wirecloud.ui.DragboardLayout);

    FreeLayout.prototype.MAX_HLU = 1000000;
    FreeLayout.prototype.MAX_HLU_PERCENTAGE = 10000;

    FreeLayout.prototype.fromPixelsToVCells = function fromPixelsToVCells(pixels) {
        return (pixels * this.MAX_HLU / this.getHeight());
    };

    FreeLayout.prototype.fromVCellsToPixels = function fromVCellsToPixels(cells) {
        return Math.round((this.getHeight() * cells) / this.MAX_HLU);
    };

    FreeLayout.prototype.getWidthInPixels = function getWidthInPixels(cells) {
        return this.fromHCellsToPixels(cells);
    };

    FreeLayout.prototype.getHeightInPixels = function getHeightInPixels(cells) {
        return this.fromVCellsToPixels(cells);
    };

    FreeLayout.prototype.fromPixelsToHCells = function fromPixelsToHCells(pixels) {
        return (pixels * this.MAX_HLU / this.getWidth());
    };

    FreeLayout.prototype.fromHCellsToPixels = function fromHCellsToPixels(cells) {
        return Math.round((this.getWidth() * cells) / this.MAX_HLU);
    };

    FreeLayout.prototype.getColumnOffset = function getColumnOffset(position, css) {
        let margin = position.anchor.endsWith("left") ? this.dragboard.leftMargin : this.dragboard.rightMargin;
        if (css) {
            if (position.relx) {
                let percentage = position.x / this.MAX_HLU_PERCENTAGE;
                return "calc(" + percentage + "% + " + (margin - (percentage * (this.dragboard.leftMargin + this.dragboard.rightMargin) / 100)) + "px)";
            } else {
                return (margin + position.x) + "px";
            }
        } else {
            return margin + (position.relx ? this.fromHCellsToPixels(position.x) : position.x);
        }
    };

    FreeLayout.prototype.getRowOffset = function getRowOffset(position, css) {
        let margin = position.anchor.startsWith("bottom") ? this.dragboard.bottomMargin : this.dragboard.topMargin;
        if (css) {
            if (position.rely) {
                let percentage = position.y / this. MAX_HLU_PERCENTAGE;
                return "calc(" + percentage + "% + " + (margin - (percentage * (this.dragboard.topMargin + this.dragboard.bottomMargin) / 100)) + "px)";
            } else {
                return (margin + position.y) + "px";
            }
        } else {
            return margin + (position.rely ? this.fromVCellsToPixels(position.y) : position.y);
        }
    };

    FreeLayout.prototype.adaptColumnOffset = function adaptColumnOffset(size) {
        var offsetInLU, offsetInPixels, pixels, parsedSize;

        parsedSize = this.parseSize(size);
        if (parsedSize[1] === 'cells') {
            offsetInLU = Math.round(parsedSize[0]);
        } else {
            if (parsedSize[1] === '%') {
                pixels = Math.round((parsedSize[0] * this.getWidth()) / 100);
            } else {
                pixels = parsedSize[0] < this.dragboard.leftMargin ? 0 : parsedSize[0] - this.dragboard.leftMargin;
            }
            offsetInLU = Math.round(this.fromPixelsToHCells(pixels));
        }
        offsetInPixels = this.fromHCellsToPixels(offsetInLU);
        return new Wirecloud.ui.MultiValuedSize(offsetInPixels, offsetInLU);
    };

    FreeLayout.prototype.adaptRowOffset = function adaptRowOffset(size) {
        let newsize = this.adaptHeight(size).inPixels;
        newsize = newsize >= this.dragboard.topMargin ? newsize - this.dragboard.topMargin : 0;
        let offsetLU = Math.round(this.fromPixelsToVCells(newsize));
        return new Wirecloud.ui.MultiValuedSize(newsize, offsetLU);
    };

    FreeLayout.prototype.adaptHeight = function adaptHeight(size) {
        var pixels, parsedSize;

        parsedSize = this.parseSize(size);
        switch (parsedSize[1]) {
        case "%":
            pixels = Math.round((parsedSize[0] * this.getHeight()) / 100);
            break;
        case "cells":
            /* falls through */
        case "px":
            pixels = parsedSize[0];
            break;
        }
        let heightLU = Math.round(this.fromPixelsToVCells(pixels));
        return new Wirecloud.ui.MultiValuedSize(pixels, heightLU);
    };

    FreeLayout.prototype._notifyWindowResizeEvent = function _notifyWindowResizeEvent(widthChanged, heightChanged) {
        if (widthChanged) {
            Wirecloud.ui.DragboardLayout.prototype._notifyWindowResizeEvent.call(this, widthChanged, heightChanged);
        }
    };

    FreeLayout.prototype._notifyResizeEvent = function _notifyResizeEvent(widget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, resizeTopSide, persist) {
        let position = {};
        if (
            (resizeLeftSide && widget.position.anchor.endsWith("left"))
            || (!resizeLeftSide && widget.position.anchor.endsWith("right"))
        ) {
            let widthDiff = newWidth - oldWidth;
            if (widthDiff !== 0) {
                position.x = widget.position.x - widthDiff;
            }
        } else if (resizeLeftSide && widget.position.anchor.endsWith("center")) {
            let widthDiff = newWidth - oldWidth;
            if (widthDiff !== 0) {
                position.x = widget.position.x - widthDiff / 2;
            }
        }

        if (
            (resizeTopSide && widget.position.anchor.startsWith("top"))
            || (!resizeTopSide && widget.position.anchor.startsWith("bottom"))
        ) {
            let heightDiff = newHeight - oldHeight;
            if (heightDiff !== 0) {
                position.y = widget.position.y - heightDiff;
            }
        }

        if (Object.keys(position).length > 0) {
            widget.setPosition(position).repaint();
        }

        if (persist) {
            // Save new position into persistence
            this.dragboard.update([widget.id]);
        }
    };

    FreeLayout.prototype.initialize = function initialize() {
        for (const widget of Object.values(this.widgets)) {
            widget.repaint();
        }

        this.initialized = true;

        return false;
    };

    /**
     * Calculate what cell is at a given position in pixels
     */
    FreeLayout.prototype.getCellAt = function getCellAt(x, y) {
        return new Wirecloud.DragboardPosition(((x - this.dragboard.leftMargin) * this.MAX_HLU) / this.getWidth(), y - this.dragboard.topMargin);
    };

    FreeLayout.prototype.addWidget = function addWidget(iWidget, affectsDragboard) {
        Wirecloud.ui.DragboardLayout.prototype.addWidget.call(this, iWidget, affectsDragboard);

        if (!this.initialized) {
            return;
        }

        this._adaptIWidget(iWidget);

        return new Set();
    };

    FreeLayout.prototype.initializeMove = function initializeMove(widget, draggable) {
        var msg;

        if (widget == null || !(widget instanceof Wirecloud.ui.WidgetView)) {
            throw new TypeError("widget must be an WidgetView instance");
        }

        // Check for pendings moves
        if (this.iwidgetToMove !== null) {
            msg = "Dragboard: There was a pending move that was cancelled because initializedMove function was called before it was finished.";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            this.cancelMove();
        }

        this.iwidgetToMove = widget;
        this.newPosition = {
            x: widget.wrapperElement.offsetLeft,
            y: widget.wrapperElement.offsetTop
        };

        draggable.setXOffset(0).setYOffset(0);
    };

    FreeLayout.prototype.moveTemporally = function moveTemporally(x, y) {
        if (this.iwidgetToMove == null) {
            var msg = "Dragboard: You must call initializeMove function before calling to this function (moveTemporally).";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        if (y < 0) {
            y = 0;
        }
        if (x < 0) {
            x = 0;
        } else {
            var maxX = this.MAX_HLU - this.iwidgetToMove.shape.width;
            if (x > maxX) {
                x = maxX;
            }
        }

        this.newPosition.x = x;
        this.newPosition.y = y;
    };

    FreeLayout.prototype.acceptMove = function acceptMove() {
        if (this.iwidgetToMove == null) {
            var msg = "Dragboard: Function acceptMove called when there is not an started iwidget move.";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        // Y coordinate
        if (["bottom-center", "bottom-left", "bottom-right"].indexOf(this.iwidgetToMove.position.anchor) !== -1) {
            this.newPosition.y = this.getHeight() - this.iwidgetToMove.wrapperElement.offsetHeight - this.newPosition.y;
        }
        if (this.iwidgetToMove.position.rely) {
            this.newPosition.y = this.adaptRowOffset(this.newPosition.y + 'px').inLU;
        } else if (this.iwidgetToMove.position.anchor.startsWith("bottom")) {
            this.newPosition.y += this.dragboard.topMargin;
        } else {
            this.newPosition.y -= this.dragboard.topMargin;
        }

        // X coordinate
        if (["bottom-center", "top-center"].indexOf(this.iwidgetToMove.position.anchor) !== -1) {
            this.newPosition.x += (this.iwidgetToMove.shape.relwidth ? this.getWidthInPixels(this.iwidgetToMove.shape.width) : this.iwidgetToMove.shape.width) / 2;
        } else if (["bottom-right", "top-right"].indexOf(this.iwidgetToMove.position.anchor) !== -1) {
            this.newPosition.x = this.getWidth() - this.iwidgetToMove.wrapperElement.offsetWidth - this.newPosition.x;
        }
        if (this.iwidgetToMove.position.relx) {
            this.newPosition.x = this.adaptColumnOffset(this.newPosition.x + 'px').inLU;
        } else if (this.iwidgetToMove.position.anchor.endsWith("right")) {
            this.newPosition.x += this.dragboard.leftMargin;
        } else {
            this.newPosition.x -= this.dragboard.leftMargin;
        }
        this.iwidgetToMove.setPosition(this.newPosition);
        this.dragboard.update([this.iwidgetToMove.id]);

        this.iwidgetToMove = null;
        this.newPosition = null;
    };

    FreeLayout.prototype.updatePosition = function updatePosition(widget, element) {
        switch (widget.position.anchor) {
        case "top-left":
        case "top-right":
        case "top-center":
            element.style.top = this.getRowOffset(widget.position, true);
            element.style.bottom = "";
            break;
        case "bottom-left":
        case "bottom-right":
        case "bottom-center":
            element.style.top = "";
            element.style.bottom = this.getRowOffset(widget.position, true);
            break;
        }

        switch (widget.position.anchor) {
        case "top-right":
        case "bottom-right":
            element.style.left = "";
            element.style.right = this.getColumnOffset(widget.position, true);
            element.style.marginLeft = "";
            break;
        case "top-left":
        case "bottom-left":
            element.style.left = this.getColumnOffset(widget.position, true);
            element.style.right = "";
            element.style.marginLeft = "";
            break;
        case "top-center":
        case "bottom-center":
            element.style.left = this.getColumnOffset(widget.position, true);
            element.style.right = "";
            if (widget.shape.relwidth) {
                let percentage = widget.shape.width / 2 / this.MAX_HLU_PERCENTAGE;
                element.style.marginLeft = "calc(-" + percentage + '% + ' + (percentage * (this.dragboard.leftMargin + this.dragboard.rightMargin) / 100) + 'px)';
            } else {
                element.style.marginLeft = '-' + (widget.shape.width / 2) + 'px';
            }

            break;
        }

        return this;
    };

    FreeLayout.prototype.updateShape = function updateShape(widget, element) {
        if (widget.shape.relwidth) {
            let percentage = widget.shape.width / this.MAX_HLU_PERCENTAGE;
            element.style.width = "calc(" + percentage + '% - ' + (percentage * (this.dragboard.leftMargin + this.dragboard.rightMargin) / 100) + 'px)';
        } else {
            element.style.width = widget.shape.width + 'px';
        }
        if (widget.minimized) {
            element.style.height = "";
        } else if (widget.shape.relheight) {
            let percentage = widget.shape.height / this.MAX_HLU_PERCENTAGE;
            element.style.height = "calc(" + percentage + '% - ' + (percentage * (this.dragboard.topMargin + this.dragboard.bottomMargin) / 100) + 'px)';
        } else {
            element.style.height = widget.shape.height + 'px';
        }

        return this;
    };

    FreeLayout.prototype.cancelMove = function cancelMove() {
        var msg;

        if (this.iwidgetToMove == null) {
            msg = "Trying to cancel an inexistant temporal move.";
            Wirecloud.GlobalLogManager.log(msg, Wirecloud.constants.LOGGING.WARN_MSG);
            return;
        }

        // We have only update the CSS of the widget but not the position attribute
        // Repaint it using the initial position
        this.iwidgetToMove.repaint();
        this.iwidgetToMove = null;
        this.newPosition = null;
    };

    const setPosition = function setPosition(position, options, offset) {
        delete options.left;
        delete options.top;
        delete options.right;
        delete options.bottom;

        switch (position) {
        case "top-right":
            options.left = offset.x + options.refposition.left - this.dragboard.leftMargin;
            options.top = offset.y + options.refposition.top - this.dragboard.topMargin - options.height;
            break;
        case "top-left":
            options.left = offset.x + options.refposition.right - this.dragboard.leftMargin - this.getWidthInPixels(options.width);
            options.top = offset.y + options.refposition.top - this.dragboard.topMargin - options.height;
            break;
        case "bottom-right":
            options.left = offset.x + options.refposition.left - this.dragboard.leftMargin;
            options.top = offset.y + options.refposition.bottom - this.dragboard.topMargin;
            break;
        case "bottom-left":
            options.left = offset.x + options.refposition.right - this.dragboard.leftMargin - this.getWidthInPixels(options.width);
            options.top = offset.y + options.refposition.bottom - this.dragboard.topMargin;
            break;
        }
    };

    const standsOut = function standsOut(options) {
        var width_in_pixels = this.getWidthInPixels(options.width);
        var height_in_pixels = options.height;

        var visible_width = width_in_pixels - Math.max(options.left + width_in_pixels - this.getWidth(), 0) - Math.max(-options.left, 0);
        var visible_height = height_in_pixels - Math.max(options.top + height_in_pixels - this.getHeight(), 0) - Math.max(-options.top, 0);
        var element_area = width_in_pixels * height_in_pixels;
        var visible_area = visible_width * visible_height;
        return element_area - visible_area;
    };

    FreeLayout.prototype.searchBestPosition = function searchBestPosition(options) {
        var offset = {x: 0, y: 0};
        if (options.refiframe != null) {
            offset = Wirecloud.Utils.getRelativePosition(options.refiframe, this.dragboard.tab.wrapperElement);
        }

        var i = 0, weights = [];

        var placements = ["bottom-right", "bottom-left", "top-right", "top-left"];
        do {
            setPosition.call(this, placements[i], options, offset);
            weights.push(standsOut.call(this, options));
            i += 1;
        } while (weights[i - 1] > 0 && i < placements.length);

        if (weights[i - 1] > 0) {
            let best_weight = Math.min.apply(Math, weights);
            let index = weights.indexOf(best_weight);
            let placement = placements[index];
            setPosition.call(this, placement, options, offset);

            options.top = this.adaptRowOffset(options.top + "px").inPixels;
            options.left = this.adaptColumnOffset(options.left + "px").inLU;

            if (options.left + options.width >= this.MAX_HLU) {
                options.width -= options.left + options.width - this.MAX_HLU;
            }
        } else {
            options.top = this.adaptRowOffset(options.top + "px").inPixels;
            options.left = this.adaptColumnOffset(options.left + "px").inLU;
        }
    };

    Wirecloud.ui.FreeLayout = FreeLayout;

})(Wirecloud.Utils);
