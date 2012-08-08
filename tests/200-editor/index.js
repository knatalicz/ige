(function () {
	IgeEditor = IgeEventingClass.extend({
		init: function () {
			var self = this;

			this._projectPath = 'projects/default';
			this._prePanels = {};
			this._panels = {};
			this._windows = {};

			// Listen for when the engine iframe has loaded
			$(document).ready(function () {
				$('#igeFrame').load(self._engineLoaded);
			});
		},

		setupPage: function () {
			// Splitters
			$("#vertical").kendoSplitter({
				orientation: "vertical",
				autoHeight: true,
				panes: [
					{ collapsible: true, resizable: false, size: '28px' },
					{ collapsible: false, autoHeight: true },
					{ collapsible: true, resizable: false, size: "25px" }
				]
			});

			$("#horizontal").kendoSplitter({
				orientation: "horizontal",
				panes: [
					{ collapsible: true, resizable: false, size: "64px" },
					{ collapsible: false },
					{ collapsible: true, resizable: false, size: "250px" }
				]
			});

			$("#vertical").data("kendoSplitter").autoResize = function () {
				var thisElement = $(this.element),
					options = this.options,
					paneElements = thisElement.children(),
					panes = this.options.panes,
					parentHeight,
					panesHeight = 0,
					remainingHeight = 0,
					heightPerPane = 0,
					splitHeightPanes = [],
					paneIndex, i;

				if (options.autoHeight) {
					// Get height of parent.parent element // should detect k-content and skip only if that
					parentHeight = thisElement.parent().parent().height();

					// Loop the panes and add up the absolute specified heights
					paneIndex = 0;
					paneElements.each(function (elementIndex, item) {
						// Check that the element is not a split bar!
						if (!$(item).hasClass('k-splitbar')) {
							if (panes[paneIndex].size && !panes[paneIndex].autoHeight) {
								panesHeight += parseInt($(item).height(), 10);
							} else {
								splitHeightPanes.push(elementIndex);
							}

							paneIndex++;
						} else {
							panesHeight += parseInt($(item).height() + 2, 10);
						}
					});

					// Split the remaining height among the non-absolute sized panes
					remainingHeight = parentHeight - panesHeight;
					heightPerPane = Math.floor(remainingHeight / splitHeightPanes.length);

					for (i = 0; i < splitHeightPanes.length; i++) {
						this.size('#' + paneElements[splitHeightPanes[i]].id, heightPerPane + 'px');
					}

					// Trigger splitter resize
					this.trigger("resize");
				}
			};

			$("#vertical").data("kendoSplitter").bind("collapse", function () {
				setTimeout(function () {
					$("#vertical").data("kendoSplitter").autoResize();
				}, 10);
			});

			$("#vertical").data("kendoSplitter").bind("expand", function () {
				setTimeout(function () {
					$("#vertical").data("kendoSplitter").autoResize();
				}, 10);
			});

			$(window).resize(function () {
				$("#vertical").data("kendoSplitter").autoResize();
			});

			$("#vertical").data("kendoSplitter").autoResize();

			// Setup the main drop target
			$('#mainDropTarget').kendoDropTarget({
				dragenter: function (e) {
					$('#dropText').text('Drop to Create Entity');
				},
				dragleave: function (e) {
					$('#dropText').text('Drop Here');
				},
				drop: function (e) {
					console.log('drop');
				}
			});
		},

		panel: function (id, classDefinition) {
			if (id !== undefined) {
				if (classDefinition !== undefined) {
					if (!this._ready) {
						this._prePanels[id] = classDefinition;
					} else {
						this.log('Creating panel "' + id + '"');
						this._panels[id](new classDefinition(this._panelBar));
					}
				} else {
					return this._panels[id];
				}
			}

			return this;
		},

		window: function (id, classDefinition) {
			if (id !== undefined) {
				if (classDefinition !== undefined) {
					this._windows[id] = new classDefinition();
				} else {
					return this._windows[id];
				}
			}

			return this;
		},

		selectObject: function (id) {
			if (this._selectedItem && !this._selectedItem._scene) {
				this._selectedItem.drawBounds(false);
			}

			var item = ige.$(id);
			item.drawBounds(true);
			item.drawBoundsData(true);

			this._selectedItem = item;
		},

		_processPrePanels: function () {
			var i;

			for (i in this._prePanels) {
				if (this._prePanels.hasOwnProperty(i)) {
					this.log('Creating panel "' + i + '"');
					this._panels[i] = new this._prePanels[i](this._panelBar);
					delete this._prePanels[i];
				}
			}
		},

		_engineLoaded: function () {
			// Get a reference to the engine in the iframe
			igeFrame = $('#igeFrame')[0].contentWindow;
			ige = igeFrame.ige;

			self.setupPage();

			self._ready = true;

			// Add any pre-added panels now that we're ready!
			self._processPrePanels();

			// Add the camera mouse panning component so the
			// user can pan the camera with the mouse
			ige.$('vp1').addComponent(igeFrame.IgeMouseCameraPanComponent);

			// Emit engine ready
			self.emit('engineReady');
		}
	});
}());

// Create the editor instance
editor = new IgeEditor();