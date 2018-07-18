/*!
 * ${copyright}
 */

sap.ui.define(['sap/ui/core/date/UniversalDate', 'sap/ui/core/InvisibleText', 'sap/ui/unified/library'],
	function (UniversalDate, InvisibleText, unifiedLibrary) {
		"use strict";

		// shortcut for sap.ui.unified.CalendarDayType
		var CalendarDayType = unifiedLibrary.CalendarDayType;

		// shortcut for sap.ui.unified.CalendarAppointmentVisualization
		var CalendarAppointmentVisualization = unifiedLibrary.CalendarAppointmentVisualization;

		/**
		 * OnePersonGrid renderer.
		 * @namespace
		 */
		var OnePersonGridRenderer = {};


		/**
		 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
		 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
		 */
		OnePersonGridRenderer.render = function (oRm, oControl) {
			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.addClass("sapMOnePersonGrid");
			oRm.addClass("sapUiSizeCompact"); // TODO: for now force Compact mode
			oRm.writeClasses();
			oRm.write(">");
			oRm.renderControl(oControl.getAggregation("_columnHeaders"));
			oRm.write("<div");
			oRm.addClass("sapMOnePersonGridContent");
			oRm.writeClasses();
			oRm.write(">");
			this.renderRowHeaders(oRm, oControl);
			this.renderNowMarker(oRm, oControl);
			this.renderColumns(oRm, oControl);
			oRm.write("</div>"); // END .sapMOnePersonGridContent
			oRm.write("</div>"); // END .sapMOnePersonGrid
		};

		OnePersonGridRenderer.renderRowHeaders = function (oRm, oControl) {
			var iStartHour = oControl._getVisibleStartHour(),
				iEndHour = oControl._getVisibleEndHour();

			oRm.write("<div");
			oRm.addClass("sapMOnePersonRowHeaders");
			oRm.writeClasses();
			oRm.write(">");

			for (var i = iStartHour; i <= iEndHour; i++) {
				oRm.write("<span");
				oRm.addClass("sapMOnePersonRowHeader");
				oRm.addClass("sapMOnePersonRowHeader" + i);

				if (oControl._shouldHideRowHeader(i)) {
					oRm.addClass("sapMOnePersonRowHeaderHidden");
				}

				oRm.writeClasses();
				oRm.write(">");
				oRm.write(i);
				oRm.write("</span>"); // END .sapMOnePersonRowHeader
			}

			oRm.write("</div>"); // END .sapMOnePersonRowHeaders
		};

		OnePersonGridRenderer.renderColumns = function (oRm, oControl) {
			var iColumns = oControl._getColumns(),
				oStartDate = oControl.getStartDate(),
				oAppointmentsToRender = oControl._getAppointmentsToRender();

			oRm.write("<div");
			oRm.addClass("sapMOnePersonColumns");
			oRm.writeClasses();
			oRm.write(">");

			for (var i = 0; i < iColumns; i++) {
				var oColumnDate = new UniversalDate(oStartDate.getFullYear(), oStartDate.getMonth(), oStartDate.getDate() + i),
					sDate = oControl._formatDayAsString(oColumnDate);

				oRm.write("<div");
				oRm.writeAttribute("data-sap-day", sDate);
				oRm.addClass("sapMOnePersonColumn");

				if (oControl._areDatesInSameDay(oColumnDate, oControl._getUniversalCurrentDate())) {
					oRm.addClass("sapMOnePersonColumnToday");
				}

				if (oControl._isWeekend(oColumnDate)) {
					oRm.addClass("sapMOnePersonColumnWeekend");
				}

				oRm.writeClasses();
				oRm.write(">");
				this.renderRows(oRm, oControl);
				this.renderAppointments(oRm, oControl, oAppointmentsToRender[sDate], oColumnDate);
				oRm.write("</div>"); // END .sapMOnePersonColumn
			}

			oRm.write("</div>"); // END .sapMOnePersonColumns
		};

		OnePersonGridRenderer.renderRows = function (oRm, oControl) {
			var iStartHour = oControl._getVisibleStartHour(),
				iEndHour = oControl._getVisibleEndHour();

			for (var i = iStartHour; i <= iEndHour; i++) {
				oRm.write("<div");
				oRm.addClass("sapMOnePersonRow");

				if (!oControl._isWorkingHour(i)) {
					oRm.addClass("sapMOnePersonNonWorkingRow");
				}
				oRm.writeAttribute("data-sap-hour", i);

				oRm.writeClasses();
				oRm.write(">");
				oRm.write("</div>"); // END .sapMOnePersonRow
			}
		};

		OnePersonGridRenderer.renderAppointments = function (oRm, oControl, oAppointmentsByDate, oColumnDate) {
			var that = this;

			if (oAppointmentsByDate) {
				oRm.write("<div");
				oRm.addClass("sapMOnePersonAppointments");

				if (oControl.getAppointmentsVisualization() === CalendarAppointmentVisualization.Filled) {
					oRm.addClass("sapUiCalendarRowVisFilled"); // TODO: when refactor the CSS of appointments maybe we won't need this class
				}

				oRm.writeClasses();
				oRm.write(">");
				oAppointmentsByDate.oAppointmentsList.getIterator().forEach(function (oAppointmentNode) {
					var iMaxLevel = oAppointmentsByDate.iMaxLevel,
						iLevel = oAppointmentNode.level,
						iWidth = oAppointmentNode.width,
						oAppointment = oAppointmentNode.getData();

					that.renderAppointment(oRm, oControl, iMaxLevel, iLevel, iWidth, oAppointment, oColumnDate);
				});
				oRm.write("</div>");
			}
		};

		OnePersonGridRenderer.renderAppointment = function(oRm, oControl, iMaxLevel, iAppointmentLevel, iAppointmentWidth, oAppointment, oColumnDate) {
			var bFilled = oControl.getAppointmentsVisualization() === CalendarAppointmentVisualization.Filled,
				iRowHeight = oControl._getRowHeight(),
				oColumnStartDateAndHour = new UniversalDate(oColumnDate.getFullYear(), oColumnDate.getMonth(), oColumnDate.getDate(), oControl._getVisibleStartHour()),
				oColumnEndDateAndHour = new UniversalDate(oColumnDate.getFullYear(), oColumnDate.getMonth(), oColumnDate.getDate(), oControl._getVisibleEndHour()),
				oAppStartDate = oAppointment.getStartDate(),
				oAppEndDate = oAppointment.getEndDate(),
				sTooltip = oAppointment.getTooltip_AsString(),
				sType = oAppointment.getType(),
				sColor = oAppointment.getColor(),
				sTitle = oAppointment.getTitle(),
				sText = oAppointment.getText(),
				sIcon = oAppointment.getIcon(),
				sId = oAppointment.getId(),
				mAccProps = {labelledby: {value: InvisibleText.getStaticId("sap.ui.unified", "APPOINTMENT") + " " + sId + "-Descr", append: true}},
				aAriaLabels = oControl.getAriaLabelledBy(),
				bAppStartIsOutsideVisibleStartHour = oColumnStartDateAndHour.getTime() > oAppStartDate.getTime(),
				bAppEndIsOutsideVisibleEndHour = oColumnEndDateAndHour.getTime() < oAppEndDate.getTime(),
				iAppTop = bAppStartIsOutsideVisibleStartHour ? 0 : oControl._calculateTopPosition(oAppStartDate),
				iAppBottom = bAppEndIsOutsideVisibleEndHour ? 0 : oControl._calculateBottomPosition(oAppEndDate),
				iAppChunkWidth = 100 / (iMaxLevel + 1);

			if (aAriaLabels.length > 0) {
				mAccProps["labelledby"].value = mAccProps["labelledby"].value + " " + aAriaLabels.join(" ");
			}

			if (sTitle) {
				mAccProps["labelledby"].value = mAccProps["labelledby"].value + " " + sId + "-Title";
			}

			if (sText) {
				mAccProps["labelledby"].value = mAccProps["labelledby"].value + " " + sId + "-Text";
			}

			if (oAppointment.getSelected()) {
				mAccProps["labelledby"].value = mAccProps["labelledby"].value + " " + InvisibleText.getStaticId("sap.ui.unified", "APPOINTMENT_SELECTED");
			}

			if (oAppointment.getTentative()) {
				mAccProps["labelledby"].value = mAccProps["labelledby"].value + " " + InvisibleText.getStaticId("sap.ui.unified", "APPOINTMENT_TENTATIVE");
			}

			oRm.write("<div");
			oRm.writeElementData(oAppointment);
			oRm.writeAttribute("data-sap-level", iAppointmentLevel);
			oRm.writeAttribute("data-sap-width", iAppointmentWidth);
			if (sTooltip) {
				oRm.writeAttributeEscaped("title", sTooltip);
			}
			oRm.writeAccessibilityState(oAppointment, mAccProps);
			oRm.addClass("sapMOnePersonAppointmentWrap");
			if (bFilled) {
				 oRm.addClass("sapUiCalendarRowApps"); // TODO: when refactor the CSS of appointments maybe we won't need this class
			}
			oRm.addStyle("top", iAppTop + "px");
			oRm.addStyle("bottom", iAppBottom + "px");
			oRm.addStyle("min-height", iRowHeight / 2 + "px");
			oRm.addStyle(sap.ui.getCore().getConfiguration().getRTL() ? "right" : "left", iAppChunkWidth * iAppointmentLevel + "%");
			oRm.addStyle("width", iAppChunkWidth * iAppointmentWidth + "%"); // TODO: take into account the levels
			oRm.writeClasses();
			oRm.writeStyles();
			oRm.write(">");

			oRm.write("<div");
			oRm.addClass("sapUiCalendarApp");

			if (oAppointment.getSelected()) {
				oRm.addClass("sapUiCalendarAppSel");
			}

			if (oAppointment.getTentative()) {
				oRm.addClass("sapUiCalendarAppTent");
			}

			// if (!sText) {
			// 	oRm.addClass("sapUiCalendarAppTitleOnly");
			// }

			if (sIcon) {
				oRm.addClass("sapUiCalendarAppWithIcon");
			}

			// if (!bRelativePos) {
			// 	// write position
			// 	if (oRow._bRTL) {
			// 		oRm.addStyle("right", oAppointmentInfo.begin + "%");
			// 		oRm.addStyle("left", oAppointmentInfo.end + "%");
			// 	} else {
			// 		oRm.addStyle("left", oAppointmentInfo.begin + "%");
			// 		oRm.addStyle("right", oAppointmentInfo.end + "%");
			// 	}
			// }

			// This makes the appointment focusable
			// if (oRow._sFocusedAppointmentId == sId) {
			// 	oRm.writeAttribute("tabindex", "0");
			// } else {
			// 	oRm.writeAttribute("tabindex", "-1");
			// }

			if (!sColor && sType && sType != CalendarDayType.None) {
				oRm.addClass("sapUiCalendarApp" + sType);
			}

			// if (sColor) {
			// 	if (oRow._bRTL) {
			// 		oRm.addStyle("border-right-color", sColor);
			// 	} else {
			// 		oRm.addStyle("border-left-color", sColor);
			// 	}
			// }

			oRm.writeClasses();
			oRm.writeStyles();
			oRm.write(">"); // div element

			// extra content DIV to make some styling possible
			oRm.write("<div");
			oRm.addClass("sapUiCalendarAppCont");

			if (sColor && bFilled) {
				oRm.addStyle("background-color", oAppointment._getCSSColorForBackground(sColor));
				oRm.writeStyles();
			}

			oRm.writeClasses();
			oRm.write(">"); // div element

			if (sIcon) {
				var aClasses = ["sapUiCalendarAppIcon"];
				var mAttributes = {};

				mAttributes["id"] = sId + "-Icon";
				mAttributes["title"] = null;
				oRm.writeIcon(sIcon, aClasses, mAttributes);
			}

			if (sTitle) {
				oRm.write("<span");
				oRm.writeAttribute("id", sId + "-Title");
				oRm.addClass("sapUiCalendarAppTitle");
				oRm.writeClasses();
				oRm.write(">"); // span element
				oRm.writeEscaped(sTitle, true);
				oRm.write("</span>");
			}

			if (sText) {
				oRm.write("<span");
				oRm.writeAttribute("id", sId + "-Text");
				oRm.addClass("sapUiCalendarAppText");
				oRm.writeClasses();
				oRm.write(">"); // span element
				oRm.writeEscaped(sText, true);
				oRm.write("</span>");
			}

			// ARIA information about start and end
			// var sAriaText = oRow._oRb.getText("CALENDAR_START_TIME") + ": " + oRow._oFormatAria.format(oAppointment.getStartDate());
			// sAriaText = sAriaText + "; " + oRow._oRb.getText("CALENDAR_END_TIME") + ": " + oRow._oFormatAria.format(oAppointment.getEndDate());
			// if (sTooltip) {
			// 	sAriaText = sAriaText + "; " + sTooltip;
			// }

			// if (sType && sType != CalendarDayType.None) {
			//
			// 	sAriaText = sAriaText + "; " + this.getAriaTextForType(sType, aTypes);
			// }

			// oRm.write("<span id=\"" + sId + "-Descr\" class=\"sapUiInvisibleText\">" + sAriaText + "</span>");

			oRm.write("</div>");

			// this.renderResizeHandle(oRm, oRow, oAppointment);

			oRm.write("</div>");
			oRm.write("</div>");
		};

		OnePersonGridRenderer.renderNowMarker = function (oRm, oControl) {
			var oDate = oControl._getUniversalCurrentDate();

			oRm.write("<div");
			oRm.writeAttribute("id", oControl.getId() + "-nowMarker");
			oRm.addStyle("top", oControl._calculateTopPosition(oDate) + "px");
			oRm.addClass("sapMOnePersonNowMarker");

			if (oControl._isOutsideVisibleHours(oDate.getHours())) {
				oRm.addClass("sapMOnePersonNowMarkerHidden");
			}

			oRm.writeClasses();
			oRm.writeStyles();
			oRm.write(">");
			oRm.write("<span");
			oRm.writeAttribute("id", oControl.getId() + "-nowMarkerText");
			oRm.addClass("sapMOnePersonNowMarkerText");
			oRm.writeClasses();
			oRm.write(">");
			oRm.write(oControl._formatTimeAsString(oDate));
			oRm.write("</span>"); // END .sapMOnePersonNowMarkerText
			oRm.write("</div>"); // END .sapMOnePersonNowMarker
		};

		return OnePersonGridRenderer;

	}, true /* bExport */);
