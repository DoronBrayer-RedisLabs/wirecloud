/*
 *     Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (ns, utils) {

    "use strict";

    describe("WidgetView", () => {

        beforeAll(() => {
            ns.FullDragboardLayout = function () {};
        });

        beforeEach(() => {
            ns.WidgetViewMenuItems = jasmine.createSpy("WidgetViewMenuItems");
            utils.inherit(ns.WidgetViewMenuItems, StyledElements.DynamicMenuItems);

            ns.WidgetViewResizeHandle = jasmine.createSpy("WidgetViewResizeHandle").and.callFake(function () {
                this.addClassName = jasmine.createSpy("addClassName");
                this.setResizableElement = jasmine.createSpy("setResizableElement");
            });
        });

        afterAll(() => {
            delete ns.FullDragboardLayout;
            delete ns.WidgetViewMenuItems;
            delete ns.WidgetViewResizeHandle;
        });

        const create_layout_mock = function create_layout_mock(tab, klass) {
            let layout = Object.create(klass.prototype);
            Object.assign(layout, {
                dragboard: tab.dragboard,
                tab: tab,
                adaptColumnOffset: jasmine.createSpy("adaptColumnOffset").and.returnValue({inLU: 1}),
                adaptRowOffset: jasmine.createSpy("adaptRowOffset").and.returnValue({inLU: 2}),
                adaptHeight: jasmine.createSpy("adaptHeight").and.returnValue({inLU: 3}),
                adaptWidth: jasmine.createSpy("adaptWidth").and.returnValue({inLU: 4}),
                addWidget: jasmine.createSpy("addWidget").and.callFake(function addWidget(widget) {
                    widget.layout = this;
                    return new Set();
                }),
                getColumnOffset: jasmine.createSpy("getColumnOffset"),
                getRowOffset: jasmine.createSpy("getRowOffset"),
                removeWidget: jasmine.createSpy("removeWidget").and.callFake(function removeWidget(widget) {
                    widget.layout = null;
                    return new Set();
                }),
                getHeightInPixels: jasmine.createSpy("getHeightInPixels"),
                _notifyResizeEvent: jasmine.createSpy("_notifyResizeEvent")
            });
            if ("_searchFreeSpace" in klass.prototype) {
                layout._searchFreeSpace = jasmine.createSpy("_searchFreeSpace");
            }
            return layout;
        };

        const create_tab_mock = function create_tab_mock() {
            let tab = {
                model: {},
                workspace: {
                    addEventListener: jasmine.createSpy("addEventListener")
                }
            };
            tab.dragboard = {
                tab: tab,
                leftMargin: 1,
                topMargin: 2,
                update: jasmine.createSpy("update")
            };
            tab.dragboard.baseLayout = create_layout_mock(tab, ns.SmartColumnLayout);
            tab.dragboard.freeLayout = create_layout_mock(tab, ns.FreeLayout);
            tab.dragboard.leftLayout = create_layout_mock(tab, ns.SidebarLayout);
            tab.dragboard.rightLayout = create_layout_mock(tab, ns.SidebarLayout);
            tab.dragboard.fulldragboardLayout = create_layout_mock(tab, ns.FullDragboardLayout);
            return tab;
        };

        const create_widget_mock = function create_widget_mock(options) {
            options = options != null ? options : {};
            return {
                addEventListener: jasmine.createSpy("addEventListener"),
                changeTab: jasmine.createSpy("changeTab").and.returnValue(Promise.resolve()),
                contextManager: {
                    modify: jasmine.createSpy("modify")
                },
                fulldragboard: !!options.fulldragboard,
                id: "23",
                isAllowed: jasmine.createSpy("isAllowed").and.returnValue(true),
                layout: (options.layout != null ? options.layout : 2),
                logManager: {
                    addEventListener: jasmine.createSpy("addEventListener")
                },
                position: {
                    x: 3,
                    y: 0,
                    z: 0
                },
                reload: jasmine.createSpy("reload"),
                shape: {
                    width: 5,
                    heihgt: 1
                },
                remove: jasmine.createSpy("remove"),
                showLogs: jasmine.createSpy("showLogs"),
                showSettings: jasmine.createSpy("showSettings"),
                title: "My Widget",
                wrapperElement: document.createElement('div')
            };
        };

        describe("new WidgetView(tab, model, options)", () => {

            it("should throw a TypeError exception when not passing any parameter", () => {
                expect(() => {
                    new ns.WidgetView();
                }).toThrowError(TypeError);
            });

            it("should work by providing options", () => {
                let tab = create_tab_mock();
                let model = create_widget_mock();
                let widget = new ns.WidgetView(tab, model);

                // Check initial values
                expect(widget.tab).toBe(tab);
                expect(widget.model).toBe(model);
                expect(widget.id).toBe(model.id);
                expect(widget.layout).toBe(tab.dragboard.leftLayout);
                expect(widget.minimized).toBe(false);
                expect(widget.title).toBe(model.title);
                expect(widget.shape).toEqual(model.shape);
                expect(widget.position).toEqual(model.position);
            });

        });

        describe("moveToLayout(newLayout)", () => {

            it("should do nothing if target layout is the current one", () => {
                let tab = create_tab_mock();
                let model = create_widget_mock({layout: 0});
                let widget = new ns.WidgetView(tab, model);

                widget.moveToLayout(widget.layout);
            });

            it("should work when not affecting other widgets", (done) => {
                let tab = create_tab_mock();
                let model = create_widget_mock({layout: 1});
                let widget = new ns.WidgetView(tab, model);
                let newLayout = create_layout_mock(tab, ns.FreeLayout);

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["23"]);
                    done();
                });
            });

            it("should work when affecting other widgets", (done) => {
                let tab = create_tab_mock();
                let model = create_widget_mock({layout: 3});
                let widget = new ns.WidgetView(tab, model);
                let newLayout = create_layout_mock(tab, ns.FreeLayout);
                widget.layout.removeWidget.and.callFake(function () {
                    widget.layout = null;
                    return new Set(["1"]);
                });
                newLayout.addWidget.and.callFake(function () {
                    widget.layout = this;
                    return new Set(["3", "4"]);
                });

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(widget.layout).toBe(newLayout);
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["3", "4", "23", "1"]);
                    done();
                });
            });

            it("should split updates when moving widget between tabs", (done) => {
                let tab1 = create_tab_mock();
                let model = create_widget_mock();
                let widget = new ns.WidgetView(tab1, model);
                let tab2 = create_tab_mock();
                let oldLayout = widget.layout;
                let newLayout = create_layout_mock(tab2, ns.FreeLayout);
                widget.layout.removeWidget.and.callFake(function () {
                    widget.layout = null;
                    return new Set(["1"]);
                });
                newLayout.addWidget.and.callFake(function () {
                    widget.layout = this;
                    return new Set(["3", "4"]);
                });

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(widget.model.changeTab).toHaveBeenCalledWith(tab2.model);
                    expect(widget.tab).toBe(tab2);
                    expect(widget.layout).toBe(newLayout);
                    expect(oldLayout.dragboard.update).toHaveBeenCalledWith(["1"]);
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["3", "4", "23"]);
                    done();
                });
            });

            it("should manage minimized widgets", (done) => {
                let tab1 = create_tab_mock();
                let model = create_widget_mock();
                model.minimized = true;
                let widget = new ns.WidgetView(tab1, model);
                let tab2 = create_tab_mock();
                let oldLayout = widget.layout;
                let newLayout = create_layout_mock(tab2, ns.FreeLayout);
                widget.layout.removeWidget.and.callFake(function () {
                    widget.layout = null;
                    return new Set(["1"]);
                });
                newLayout.addWidget.and.callFake(function () {
                    widget.layout = this;
                    return new Set(["3", "4"]);
                });

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(widget.layout).toBe(newLayout);
                    expect(oldLayout.dragboard.update).toHaveBeenCalledWith(["1"]);
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["3", "4", "23"]);
                    done();
                });
            });

            it("should relocate widgets if target layout is not a free layout", (done) => {
                let tab1 = create_tab_mock();
                let model = create_widget_mock();
                let widget = new ns.WidgetView(tab1, model);
                let tab2 = create_tab_mock();
                let oldLayout = widget.layout;
                let newLayout = create_layout_mock(tab2, ns.SmartColumnLayout);
                widget.layout.removeWidget.and.callFake(function () {
                    widget.layout = null;
                    return new Set(["1"]);
                });
                newLayout.addWidget.and.callFake(function () {
                    widget.layout = this;
                    return new Set(["3", "4"]);
                });

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(widget.layout).toBe(newLayout);
                    expect(oldLayout.dragboard.update).toHaveBeenCalledWith(["1"]);
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["3", "4", "23"]);
                    done();
                });
            });

            it("should restore widget shape when coming back from a full dragboard layout", (done) => {
                let tab = create_tab_mock();
                let model = create_widget_mock({fulldragboard: true});
                let widget = new ns.WidgetView(tab, model);
                let newLayout = create_layout_mock(tab, ns.SmartColumnLayout);
                newLayout.addWidget.and.callFake(function () {
                    widget.layout = this;
                    return new Set(["3", "5"]);
                });

                widget.moveToLayout(newLayout);
                setTimeout(() => {
                    expect(widget.layout).toBe(newLayout);
                    expect(newLayout.dragboard.update).toHaveBeenCalledWith(["3", "5", "23"]);
                    done();
                });
            });

        });

        describe("reload()", () => {

            it("should work", () => {
                let tab = create_tab_mock();
                let model = create_widget_mock();
                let widget = new ns.WidgetView(tab, model);

                expect(widget.reload()).toBe(widget);
                expect(widget.model.reload).toHaveBeenCalledWith();
            });

        });

        describe("showLogs()", () => {

            it("should work", () => {
                let tab = create_tab_mock();
                let model = create_widget_mock();
                let widget = new ns.WidgetView(tab, model);

                expect(widget.showLogs()).toBe(widget);
                expect(widget.model.showLogs).toHaveBeenCalledWith();
            });

        });

        describe("showSettings()", () => {

            it("should work", () => {
                let tab = create_tab_mock();
                let model = create_widget_mock();
                let widget = new ns.WidgetView(tab, model);

                expect(widget.showSettings()).toBe(widget);
                expect(widget.model.showSettings).toHaveBeenCalledWith();
            });

        });

        describe("repaint()", () => {

            it("should work", () => {
                let tab = create_tab_mock();
                let model = create_widget_mock();
                let widget = new ns.WidgetView(tab, model);

                expect(widget.repaint()).toBe(widget);
            });

        });

        describe("remove()", () => {

            it("should work", () => {
                let tab = create_tab_mock();
                let model = create_widget_mock();
                let widget = new ns.WidgetView(tab, model);

                expect(widget.remove()).toBe(widget);
            });

        });

    });

})(Wirecloud.ui, StyledElements.Utils);