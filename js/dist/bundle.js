(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Date_Helpers_1 = require("./../helpers/Date_Helpers");
class GTFS_DB_Controller {
    constructor() {
        this.progress_controller = null;
        this.gtfs_rt_reporter = null;
        this.request_datetime = new Date();
        this.is_dev = false;
        this.use_mocked_data = false;
        this.use_filtered_lookup = false;
        this.is_dev = location.hostname === 'localhost';
        if (this.is_dev) {
            this.use_mocked_data = true;
            this.use_filtered_lookup = true;
            // this.use_mocked_data = false;
            // this.use_filtered_lookup = false;
        }
        else {
            this.use_mocked_data = false;
            this.use_filtered_lookup = false;
        }
        this.gtfs_query_btn = document.getElementById('gtfs_query_btn');
        this.gtfs_query_btn.addEventListener('click', () => {
            this.handle_gtfs_query_btn_click();
        });
        this.query_request_day_el = document.getElementById('request-day');
        this.query_request_time_el = document.getElementById('request-time');
        this.query_interval_from_time_el = document.getElementById('interval-from-time');
        this.query_interval_to_time_el = document.getElementById('interval-to-time');
        this.gtfs_query_btn.disabled = true;
        this.update_request_time();
    }
    update_query_inputs() {
        const now_date = this.request_datetime;
        const date_f = Date_Helpers_1.Date_Helpers.formatDateYMDHIS(now_date);
        // - 30min
        const from_date = new Date(now_date.getTime() + (-30) * 60 * 1000);
        const from_date_f = Date_Helpers_1.Date_Helpers.formatDateYMDHIS(from_date);
        // + 3hours
        const to_date = new Date(now_date.getTime() + (3 * 60) * 60 * 1000);
        const to_date_f = Date_Helpers_1.Date_Helpers.formatDateYMDHIS(to_date);
        this.query_request_day_el.value = date_f.substring(0, 10);
        this.query_request_time_el.value = date_f.substring(11, 16);
        this.query_interval_from_time_el.value = from_date_f.substring(11, 16);
        this.query_interval_to_time_el.value = to_date_f.substring(11, 16);
    }
    load_resources(completion) {
        var _a;
        (_a = this.progress_controller) === null || _a === void 0 ? void 0 : _a.setBusy('Loading Resources...');
        let gtfsDBDay = new Date();
        // const m = "2021-04-14 18:50:23".split(/\D/);
        // gtfsDBDay = new Date(+m[0], +m[1] - 1, +m[2], +m[3], +m[4], +m[5]);
        const gtfs_db_day_s = this.computeGTFS_DB_Day(gtfsDBDay);
        let gtfs_db_snapshot_base = 'https://opentdatach.github.io/assets-gtfs-static-snapshot';
        if (this.is_dev) {
            gtfs_db_snapshot_base = 'http://localhost/work/vasile/sbb/ojp-opendata/repos/openTdataCH--OJP-Showcase/apps/gtfs-rt-comparison-html/data/gtfs-static-snapshot';
        }
        gtfs_db_snapshot_base += '/gtfs_' + gtfs_db_day_s;
        const gtfs_db_lookups_url = gtfs_db_snapshot_base + '/db_lookups.json';
        const request_day_s = this.query_request_day_el.value;
        let gtfs_db_trips_url = gtfs_db_snapshot_base + '/trips_' + request_day_s + '.json';
        if (this.use_filtered_lookup) {
            console.log('WARNING - using filtered lookup');
            gtfs_db_trips_url = gtfs_db_snapshot_base + '-FILTER/trips_' + request_day_s + '.json';
        }
        const resource_files = [
            gtfs_db_lookups_url,
            gtfs_db_trips_url,
        ];
        Promise.all(resource_files.map(resource_file => fetch(resource_file))).then(responses => Promise.all(responses.map(response => response.json()))).then(data_responses => {
            var _a, _b, _c, _d, _e, _f;
            (_a = this.gtfs_rt_reporter) === null || _a === void 0 ? void 0 : _a.setRequestDatetime(this.request_datetime);
            const data_response_lookups = data_responses[0];
            (_b = this.gtfs_rt_reporter) === null || _b === void 0 ? void 0 : _b.loadAgency(data_response_lookups.agency);
            (_c = this.gtfs_rt_reporter) === null || _c === void 0 ? void 0 : _c.loadStops(data_response_lookups.stops);
            (_d = this.gtfs_rt_reporter) === null || _d === void 0 ? void 0 : _d.loadRoutes(data_response_lookups.routes);
            (_e = this.gtfs_rt_reporter) === null || _e === void 0 ? void 0 : _e.loadTrips(data_responses[1]);
            this.gtfs_query_btn.disabled = false;
            (_f = this.progress_controller) === null || _f === void 0 ? void 0 : _f.setIdle();
            completion();
        }).catch(error => {
            var _a;
            (_a = this.progress_controller) === null || _a === void 0 ? void 0 : _a.setError('ERROR loading resources');
        });
    }
    computeGTFS_DB_Day(date) {
        // Wednesday (weekIdx 3) is the change
        const datasetWeekdayIDChange = 3;
        // Change time is at 14:00
        const datasetHoursChange = 14;
        let weekDayDiff = date.getDay() - datasetWeekdayIDChange;
        if (weekDayDiff < 0) {
            weekDayDiff += 7;
        }
        if (weekDayDiff === 0) {
            if (date.getHours() < datasetHoursChange) {
                weekDayDiff = 7;
            }
        }
        const newDate = new Date(date.getTime());
        newDate.setDate(date.getDate() - weekDayDiff);
        const newDateS = Date_Helpers_1.Date_Helpers.formatDateYMDHIS(newDate);
        return newDateS.substring(0, 10);
    }
    update_request_time() {
        this.request_datetime = new Date();
        // Override - TEST
        if (this.use_mocked_data) {
            let m = "2021-04-01 08:38:33".split(/\D/);
            this.request_datetime = new Date(+m[0], +m[1] - 1, +m[2], +m[3], +m[4], +m[5]);
            console.log('WARNING - using mocked data');
            console.log('-- date ' + this.request_datetime);
        }
        this.update_query_inputs();
    }
    handle_gtfs_query_btn_click() {
        var _a;
        (_a = this.progress_controller) === null || _a === void 0 ? void 0 : _a.setBusy('Fetching GTFS-RT ...');
        this.gtfs_query_btn.disabled = true;
        this.update_request_time();
        let gtfs_rt_url = 'https://www.webgis.ro/tmp/proxy-gtfsrt2020/gtfsrt2020';
        if (this.is_dev) {
            gtfs_rt_url = 'http://localhost/work/vasile/sbb/ojp-opendata/repos/openTdataCH--OJP-Showcase/apps/proxy-gtfsrt2020/gtfsrt2020';
        }
        if (this.use_mocked_data) {
            gtfs_rt_url = 'http://localhost/work/vasile/sbb/ojp-opendata/repos/openTdataCH--OJP-Showcase/apps/gtfs-rt-comparison-html/data/GTFS_RT-2021-04-01-0838-1617259113.json';
            console.log('MOCKED gtfs_rt_url = ' + gtfs_rt_url);
        }
        const gtfs_rt_promise = fetch(gtfs_rt_url);
        Promise.all([gtfs_rt_promise]).then(responses => Promise.all(responses.map(response => response.json()))).then(data_responses => {
            var _a, _b, _c;
            this.gtfs_query_btn.disabled = false;
            (_a = this.progress_controller) === null || _a === void 0 ? void 0 : _a.setIdle();
            const gtfs_rt_response = data_responses[0];
            (_b = this.gtfs_rt_reporter) === null || _b === void 0 ? void 0 : _b.setRequestDatetime(this.request_datetime);
            const request_interval_from_hhmm = this.query_interval_from_time_el.value;
            const request_interval_from_date = Date_Helpers_1.Date_Helpers.setHHMMToDate(this.request_datetime, request_interval_from_hhmm);
            const request_interval_to_hhmm = this.query_interval_to_time_el.value;
            let request_interval_to_date = Date_Helpers_1.Date_Helpers.setHHMMToDate(this.request_datetime, request_interval_to_hhmm);
            if (request_interval_to_date < request_interval_from_date) {
                request_interval_to_date.setDate(request_interval_to_date.getDate() + 1);
            }
            (_c = this.gtfs_rt_reporter) === null || _c === void 0 ? void 0 : _c.loadGTFS_RT(gtfs_rt_response, request_interval_from_date, request_interval_to_date);
        });
    }
}
exports.default = GTFS_DB_Controller;

},{"./../helpers/Date_Helpers":5}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Date_Helpers_1 = require("../helpers/Date_Helpers");
const DOM_Helpers_1 = require("../helpers/DOM_Helpers");
const response_gtfs_static_query_1 = require("./../models/response_gtfs_static_query");
class GTFS_RT_Reporter {
    constructor() {
        this.request_datetime = new Date();
        this.map_gtfs_rt_trips = {};
        this.map_gtfs_all_trips = {};
        this.trips_by_agency = [];
        this.map_gtfs_agency = {};
        this.map_gtfs_routes = {};
        this.map_gtfs_stops = {};
        this.wrapperGTFS_StaticReportElement = document.getElementById('content_wrapper');
        this.wrapperGTFS_RTReportElement = document.getElementById('hrdf_rt_wrapper');
        this.addEventHandlers();
        this.map_html_templates = {
            card_agency: document.getElementById('template_agency').innerHTML,
            card_route: document.getElementById('template_route_name').innerHTML,
            gtfs_rt_report: document.getElementById('template_gtfs_rt_report').innerHTML,
            gtfs_static_report: document.getElementById('template_gtfs_static_report').innerHTML,
        };
    }
    addEventHandlers() {
        this.wrapperGTFS_StaticReportElement.addEventListener('click', (ev) => {
            const el = ev.target;
            if (DOM_Helpers_1.DOM_Helpers.hasClassName(el, 'toggle-all-trips-btn')) {
                const agency_row_idx_s = el.getAttribute('data-agency-idx') || null;
                const route_row_idx_s = el.getAttribute('data-route-idx') || null;
                if (agency_row_idx_s === null) {
                    return;
                }
                const agency_row_idx = parseInt(agency_row_idx_s);
                const agency_data = this.trips_by_agency[agency_row_idx];
                if (route_row_idx_s === null) {
                    agency_data.show_all_trips = !agency_data.show_all_trips;
                    agency_data.routes_data.forEach(route_data => {
                        route_data.show_all_trips = agency_data.show_all_trips;
                    });
                    const agency_html = this.computeAgencyHTML(agency_data);
                    const agency_el_id = 'agency_card_' + agency_row_idx_s;
                    const agency_el = document.getElementById(agency_el_id);
                    agency_el.outerHTML = agency_html;
                }
                else {
                    const route_row_idx = parseInt(route_row_idx_s);
                    const route_data = agency_data.routes_data[route_row_idx];
                    route_data.show_all_trips = !route_data.show_all_trips;
                    const route_html = this.computeRouteHTML(route_data, agency_data);
                    if (route_html === null) {
                        return;
                    }
                    const route_el_id = 'route_card_' + agency_row_idx_s + '_' + route_row_idx_s;
                    const route_el = document.getElementById(route_el_id);
                    route_el.outerHTML = route_html;
                }
            }
        });
    }
    loadAgency(response_json) {
        this.map_gtfs_agency = {};
        const response_rows = response_json.rows;
        response_rows.forEach(agency => {
            const agency_id = agency.agency_id;
            this.map_gtfs_agency[agency_id] = agency;
        });
    }
    loadRoutes(response_json) {
        this.map_gtfs_routes = {};
        const response_rows = response_json.rows;
        response_rows.forEach(route => {
            const route_id = route.route_id;
            this.map_gtfs_routes[route_id] = route;
        });
    }
    loadStops(response_json) {
        this.map_gtfs_stops = {};
        const response_rows = response_json.rows;
        response_rows.forEach(stop => {
            const stop_id = stop.stop_id;
            this.map_gtfs_stops[stop_id] = stop;
        });
    }
    setRequestDatetime(request_datetime) {
        this.request_datetime = request_datetime;
    }
    loadTrips(response_json) {
        this.map_gtfs_all_trips = {};
        response_json.forEach(trip_condensed => {
            this.map_gtfs_all_trips[trip_condensed.trip_id] = trip_condensed;
        });
    }
    loadGTFS_RT(response_gtfs_rt, request_interval_from_date, request_interval_to_date) {
        this.map_gtfs_rt_trips = {};
        response_gtfs_rt.Entity.forEach(gtfs_rt_row => {
            var _a, _b;
            const trip_id = (_b = (_a = gtfs_rt_row.TripUpdate) === null || _a === void 0 ? void 0 : _a.Trip) === null || _b === void 0 ? void 0 : _b.TripId;
            if (trip_id) {
                this.map_gtfs_rt_trips[trip_id] = gtfs_rt_row;
            }
            else {
                console.log('ERROR - cant find trip_id');
                console.log(gtfs_rt_row);
            }
        });
        this.computeActiveTrips(request_interval_from_date, request_interval_to_date);
        this.updateGTFS_RTReport();
        this.updateGTFS_StaticReport();
    }
    computeActiveTrips(request_interval_from_date, request_interval_to_date) {
        const trip_day = new Date(this.request_datetime);
        const trip_day_midnight = Date_Helpers_1.Date_Helpers.setHHMMToDate(trip_day, "00:00");
        let map_active_trips = {};
        for (const trip_id in this.map_gtfs_all_trips) {
            const condensed_trip = this.map_gtfs_all_trips[trip_id];
            const route = this.map_gtfs_routes[condensed_trip.route_id];
            const agency = this.map_gtfs_agency[route.agency_id];
            const trip = response_gtfs_static_query_1.GTFS_Static_Trip.initWithCondensedTrip(condensed_trip, agency, route, trip_day_midnight, this.map_gtfs_stops);
            // Test the trip to be inside [-0.5h .. +3h]
            const is_active = trip.isActive(request_interval_from_date, request_interval_to_date);
            if (!is_active) {
                continue;
            }
            // Test the trip to be after NOW
            const is_finished = trip.isFinished(this.request_datetime);
            if (is_finished) {
                continue;
            }
            if (trip_id in this.map_gtfs_rt_trips) {
                trip.gtfsRT = this.map_gtfs_rt_trips[trip_id];
            }
            else {
                trip.gtfsRT = null;
            }
            if (!(agency.agency_id in map_active_trips)) {
                map_active_trips[agency.agency_id] = {};
            }
            if (!(route.route_short_name in map_active_trips[agency.agency_id])) {
                map_active_trips[agency.agency_id][route.route_short_name] = [];
            }
            map_active_trips[agency.agency_id][route.route_short_name].push(trip);
        }
        let trips_by_agency = [];
        for (const agency_id in map_active_trips) {
            const agency = this.map_gtfs_agency[agency_id];
            const agency_data = {
                agency_row_idx: -1,
                agency: agency,
                stats: {
                    rt_cno: 0,
                    active_missing_rt_cno: 0,
                    future_missing_rt_cno: 0
                },
                show_all_trips: false,
                routes_data: []
            };
            for (const route_short_name in map_active_trips[agency_id]) {
                const route_trips = map_active_trips[agency_id][route_short_name];
                const route_data = {
                    route_row_idx: -1,
                    routeName: route_short_name,
                    stats: {
                        rt_cno: 0,
                        active_missing_rt_cno: 0,
                        future_missing_rt_cno: 0
                    },
                    show_all_trips: false,
                    trips: route_trips,
                };
                route_trips.forEach(trip => {
                    const has_rt = trip.gtfsRT !== null;
                    if (has_rt) {
                        route_data.stats.rt_cno += 1;
                        agency_data.stats.rt_cno += 1;
                    }
                    else {
                        const is_in_future = trip.isInTheFuture(this.request_datetime);
                        if (is_in_future) {
                            route_data.stats.future_missing_rt_cno += 1;
                            agency_data.stats.future_missing_rt_cno += 1;
                        }
                        else {
                            route_data.stats.active_missing_rt_cno += 1;
                            agency_data.stats.active_missing_rt_cno += 1;
                        }
                    }
                });
                agency_data.routes_data.push(route_data);
            }
            // Sort by route name
            agency_data.routes_data = agency_data.routes_data.sort((a, b) => a.stats.active_missing_rt_cno < b.stats.active_missing_rt_cno ? 1 : -1);
            trips_by_agency.push(agency_data);
        }
        // Sort by number of missing RTs and agency ID
        trips_by_agency = trips_by_agency.sort((a, b) => {
            let sortKeys = [];
            [a, b].forEach(c => {
                let cKey1 = '00000' + c.stats.active_missing_rt_cno;
                cKey1 = cKey1.substr(cKey1.length - 5, 5);
                let cKey2 = '00000' + c.agency.agency_id;
                cKey2 = cKey2.substr(cKey2.length - 5, 5);
                const sortKey = cKey1 + '-' + cKey2;
                sortKeys.push(sortKey);
            });
            return sortKeys[0] < sortKeys[1] ? 1 : -1;
        });
        // Inject ids
        trips_by_agency.forEach((agency_data, agency_row_idx) => {
            agency_data.agency_row_idx = agency_row_idx;
            agency_data.routes_data.forEach((route_data, route_row_idx) => {
                route_data.route_row_idx = route_row_idx;
            });
        });
        this.trips_by_agency = trips_by_agency;
    }
    updateGTFS_RTReport() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const issuesMaxNo = 100;
        const gtfs_rt_trips_no = Object.keys(this.map_gtfs_rt_trips).length;
        let gtfsRT_ReportTRs = [];
        let mapMissingAgency = {};
        const mapGTFS_StaticAgencyIDs = {};
        this.trips_by_agency.forEach(agencyData => {
            mapGTFS_StaticAgencyIDs[agencyData.agency.agency_id] = 1;
        });
        let gtfs_rt_issues_no = 0;
        for (const trip_id in this.map_gtfs_rt_trips) {
            if (trip_id in this.map_gtfs_all_trips) {
                continue;
            }
            const gtfsRT = this.map_gtfs_rt_trips[trip_id];
            const routeID = (_b = (_a = gtfsRT.TripUpdate) === null || _a === void 0 ? void 0 : _a.Trip) === null || _b === void 0 ? void 0 : _b.RouteId;
            if (!routeID) {
                console.log('ERROR: invalid GTFS_RT response');
                console.log(gtfsRT);
                continue;
            }
            let tableRowTDs = [];
            const rowIDx = gtfs_rt_issues_no + 1;
            tableRowTDs.push('<td>' + rowIDx.toString() + '</td>');
            const tripInfo = trip_id + '<br/>' + routeID;
            tableRowTDs.push('<td>' + tripInfo + '</td>');
            let scheduleRelationshipS = (_e = (_d = (_c = gtfsRT.TripUpdate) === null || _c === void 0 ? void 0 : _c.Trip) === null || _d === void 0 ? void 0 : _d.ScheduleRelationship) !== null && _e !== void 0 ? _e : '-';
            tableRowTDs.push('<td><span class="badge bg-success">' + scheduleRelationshipS + '</span></td>');
            let agencyData = null;
            const routeData = (_f = this.map_gtfs_routes[routeID]) !== null && _f !== void 0 ? _f : null;
            if (routeData) {
                const agencyID = routeData.agency_id;
                agencyData = (_g = this.map_gtfs_agency[agencyID]) !== null && _g !== void 0 ? _g : null;
                if (agencyData) {
                    const hasAgencyInGTFS_Static = agencyID in mapGTFS_StaticAgencyIDs;
                    if (!hasAgencyInGTFS_Static) {
                        if (!(agencyID in mapMissingAgency)) {
                            mapMissingAgency[agencyID] = {
                                agency: agencyData,
                                rt_cno: 0
                            };
                        }
                        mapMissingAgency[agencyID].rt_cno += 1;
                    }
                }
            }
            if (agencyData) {
                tableRowTDs.push('<td>' + agencyData.agency_id + '</td>');
                tableRowTDs.push('<td>' + agencyData.agency_name + '</td>');
            }
            else {
                tableRowTDs.push('<td>-</td>');
                tableRowTDs.push('<td>-</td>');
            }
            let startTimeS = '';
            let startTime = (_k = (_j = (_h = gtfsRT.TripUpdate) === null || _h === void 0 ? void 0 : _h.Trip) === null || _j === void 0 ? void 0 : _j.StartTime) !== null && _k !== void 0 ? _k : null;
            if (startTime) {
                startTimeS = startTime.substr(0, 5);
            }
            tableRowTDs.push('<td>' + startTimeS + '</td>');
            let stopNames = [];
            const gtfsRTStopTimes = (_m = (_l = gtfsRT.TripUpdate) === null || _l === void 0 ? void 0 : _l.StopTimeUpdate) !== null && _m !== void 0 ? _m : [];
            gtfsRTStopTimes.forEach(stopTime => {
                var _a;
                const stopData = (_a = this.map_gtfs_stops[stopTime.StopId]) !== null && _a !== void 0 ? _a : null;
                let stopName = 'n/a';
                if (stopData) {
                    stopName = stopData.stop_name;
                }
                stopNames.push(stopName);
            });
            const stopNamesS = stopNames.join(' - ');
            tableRowTDs.push('<td>' + stopNamesS + '</td>');
            const gtfsRT_ReportTR = '<tr>' + tableRowTDs.join('') + '</tr>';
            gtfsRT_ReportTRs.push(gtfsRT_ReportTR);
            gtfs_rt_issues_no += 1;
        }
        let mapAgencyWithoutGTFS_RT = {};
        this.trips_by_agency.forEach(agencyData => {
            if (agencyData.stats.rt_cno === 0) {
                mapAgencyWithoutGTFS_RT[agencyData.agency.agency_id] = 1;
            }
        });
        let report_html = this.map_html_templates.gtfs_rt_report.slice();
        report_html = report_html.replace('[NO_RT_NO]', gtfs_rt_issues_no.toString());
        report_html = report_html.replace('[RT_NO]', gtfs_rt_trips_no.toString());
        const agencyIDsWithoutGTFS_RT = Object.keys(mapAgencyWithoutGTFS_RT);
        let agencyIDsWithoutGTFS_RT_HTML = '';
        if (agencyIDsWithoutGTFS_RT.length > 0) {
            let listItems = [];
            agencyIDsWithoutGTFS_RT.forEach(agencyID => {
                const agencyData = this.map_gtfs_agency[agencyID];
                const agencyS = agencyData.agency_id + ' - ' + agencyData.agency_name;
                listItems.push('<li>' + agencyS + '</li>');
            });
            agencyIDsWithoutGTFS_RT_HTML = listItems.join('');
        }
        report_html = report_html.replace('[AGENCY_WITHOUT_GTFS-RT_LIST]', agencyIDsWithoutGTFS_RT_HTML);
        report_html = report_html.replace('[AGENCY_WITHOUT_GTFS-RT_LIST_NO]', agencyIDsWithoutGTFS_RT.length.toString());
        let missingAgency = Object.values(mapMissingAgency);
        missingAgency = missingAgency.sort((a, b) => a.rt_cno < b.rt_cno ? 1 : -1);
        let missingAgencyHTML = '';
        if (missingAgency.length > 0) {
            let listItems = [];
            missingAgency.forEach(agencyData => {
                const agency = agencyData.agency;
                const agencyS = agency.agency_id + ' - ' + agency.agency_name + ' <span class="badge bg-success">' + agencyData.rt_cno + '</span>';
                listItems.push('<li>' + agencyS + '</li>');
            });
            missingAgencyHTML = listItems.join('');
        }
        report_html = report_html.replace('[AGENCY_WITHOUT_GO_REALTIME]', missingAgencyHTML);
        report_html = report_html.replace('[AGENCY_WITHOUT_GO_REALTIME_NO]', missingAgency.length.toString());
        const missingGTFS_StaticIssuesNo = gtfsRT_ReportTRs.length;
        let gtfsRT_IssuesS = 'Missing GTFS static entries <span class="badge bg-secondary">' + missingGTFS_StaticIssuesNo.toString() + '</span>';
        if (missingGTFS_StaticIssuesNo > issuesMaxNo) {
            gtfsRT_ReportTRs = gtfsRT_ReportTRs.slice(0, issuesMaxNo);
            gtfsRT_IssuesS += ' (showing first ' + issuesMaxNo.toString() + ' items)';
        }
        report_html = report_html.replace('[GTFS_RT_ISSUES_CAPTION]', gtfsRT_IssuesS);
        const tableRowsHTML = gtfsRT_ReportTRs.join('');
        const tableHTML = '<table class="table table-sm table-hover gtfs-trips"><thead><tr><th scope="col" style="width: 30px;">ID</th><th scope="col" style="width: 200px;">TripID / RouteID</th><th scope="col" style="width: 100px;">GTFS-RT</th><th scope="col" style="width: 20px;">ID</th><th scope="col" style="width: 100px;">Agency</th><th scope="col" class="align-middle" style="width: 70px;">Departure</th><th scope="col">Stops</th></tr></thead><tbody>' + tableRowsHTML + '</tbody></table>';
        report_html = report_html.replace('[TABLE_HTML]', tableHTML);
        this.wrapperGTFS_RTReportElement.innerHTML = report_html;
    }
    updateGTFS_StaticReport() {
        let agencyHTMLRows = [];
        this.trips_by_agency.forEach(agency_data => {
            const agency_html = this.computeAgencyHTML(agency_data);
            agencyHTMLRows.push(agency_html);
        });
        const agencyHTML = agencyHTMLRows.join("\n");
        let gtfsStaticReportHTML = this.map_html_templates.gtfs_static_report.slice();
        gtfsStaticReportHTML = gtfsStaticReportHTML.replace('[GTFS_STATIC_REPORT_HTML]', agencyHTML);
        this.wrapperGTFS_StaticReportElement.innerHTML = gtfsStaticReportHTML;
    }
    computeAgencyHTML(agency_data) {
        const agency = agency_data.agency;
        const agency_trip_stats = agency_data.stats;
        let agency_html = this.map_html_templates.card_agency.slice();
        const agency_card_id = agency_data.agency_row_idx.toString();
        agency_html = agency_html.replace(/\[AGENCY_CARD_ID\]/g, agency_card_id);
        const agency_display_name = agency.agency_id + ': ' + agency.agency_name;
        agency_html = agency_html.replace('[AGENCY_NAME]', agency_display_name);
        agency_html = agency_html.replace(/\[AGENCY_ID\]/g, agency.agency_id);
        agency_html = agency_html.replace(/\[AGENCY_ROW_IDX\]/g, agency_data.agency_row_idx.toString());
        agency_html = agency_html.replace('[NO_RT_NO]', agency_trip_stats.active_missing_rt_cno.toString());
        agency_html = agency_html.replace('[FUTURE_NO_RT_NO]', agency_trip_stats.future_missing_rt_cno.toString());
        agency_html = agency_html.replace('[RT_NO]', agency_trip_stats.rt_cno.toString());
        const badge_togle_all = agency_data.show_all_trips ? 'HIDE' : 'SHOW ALL';
        agency_html = agency_html.replace('[BADGE_TOGGLE_ALL]', badge_togle_all);
        let routes_html_rows = [];
        agency_data.routes_data.forEach(route_data => {
            const route_html = this.computeRouteHTML(route_data, agency_data);
            if (route_html) {
                routes_html_rows.push(route_html);
            }
        });
        const routes_html_s = routes_html_rows.join("\n");
        agency_html = agency_html.replace('[SERVICE_ROUTES_LIST]', routes_html_s);
        return agency_html;
    }
    computeRouteHTML(route_data, agency_data) {
        const route_trip_stats = route_data.stats;
        let route_html = this.map_html_templates.card_route.slice();
        const route_card_id = agency_data.agency_row_idx + '_' + route_data.route_row_idx.toString();
        route_html = route_html.replace(/\[ROUTE_CARD_ID\]/g, route_card_id);
        route_html = route_html.replace('[ROUTE_NAME]', route_data.routeName);
        route_html = route_html.replace('[NO_RT_NO]', route_trip_stats.active_missing_rt_cno.toString());
        route_html = route_html.replace('[FUTURE_NO_RT_NO]', route_trip_stats.future_missing_rt_cno.toString());
        route_html = route_html.replace('[RT_NO]', route_trip_stats.rt_cno.toString());
        const badge_togle_all = route_data.show_all_trips ? 'HIDE' : 'SHOW ALL';
        route_html = route_html.replace('[BADGE_TOGGLE_ALL]', badge_togle_all);
        route_html = route_html.replace(/\[AGENCY_ROW_IDX\]/g, agency_data.agency_row_idx.toString());
        route_html = route_html.replace(/\[ROUTE_ROW_IDX\]/g, route_data.route_row_idx.toString());
        const route_trips = route_data.trips.sort((a, b) => a.departureTime < b.departureTime ? -1 : 1);
        let trips_html_rows = [];
        route_trips.forEach(trip => {
            var _a;
            const is_in_future = trip.isInTheFuture(this.request_datetime);
            let table_row_tds = [];
            // IDX
            const trip_idx = trips_html_rows.length + 1;
            table_row_tds.push('<th scope="row">' + trip_idx.toString() + '</th>');
            // General info
            let info_parts = [];
            info_parts.push(trip.tripID);
            if (!is_in_future) {
                const map_url_address = trip.computeMapURL(this.request_datetime);
                const map_el_s = ' - <a href="' + map_url_address + '" target="_blank">Map</a>';
                info_parts.push(map_el_s);
            }
            info_parts.push('<br/>');
            info_parts.push(trip.route.route_id);
            table_row_tds.push('<td>' + info_parts.join('') + '</td>');
            // RT Info
            const has_rt_info = trip.gtfsRT !== null;
            let gtfs_rt_parts = [];
            if (has_rt_info) {
                const gtfs_rt = trip.gtfsRT;
                const rt_trip = (_a = gtfs_rt.TripUpdate) === null || _a === void 0 ? void 0 : _a.Trip;
                let rt_status_text = '';
                let rt_color_class = 'bg-success';
                if (rt_trip) {
                    rt_status_text = rt_trip.ScheduleRelationship;
                    if (rt_status_text === 'Canceled') {
                        rt_color_class = 'bg-danger';
                    }
                }
                gtfs_rt_parts.push('<span class="badge rounded-pill ' + rt_color_class + '">' + rt_status_text + '</span>');
            }
            else {
                gtfs_rt_parts.push('<span class="badge rounded-pill bg-secondary text-white">NO GTFS-RT</span>');
                if (is_in_future) {
                    gtfs_rt_parts.push('<span class="badge rounded-pill bg-warning text-dark">Future</span>');
                }
            }
            const gtfs_rt_s = gtfs_rt_parts.join("<br/>");
            table_row_tds.push('<td>' + gtfs_rt_s + '</td>');
            // From-To Dates
            const trip_from_s = Date_Helpers_1.Date_Helpers.formatDateYMDHIS(trip.departureTime).substr(10, 6);
            const trip_to_s = Date_Helpers_1.Date_Helpers.formatDateYMDHIS(trip.arrivalTime).substr(10, 6);
            table_row_tds.push('<td>' + trip_from_s + ' - ' + trip_to_s + '</td>');
            // Stop Times
            let stop_times_parts = [];
            trip.stop_times.forEach((stop_time, stop_idx) => {
                const stop_data = stop_time.stop;
                const stop_display_time = stop_time.stop_departure ? stop_time.stop_departure : stop_time.stop_arrival;
                const stop_display_time_s = Date_Helpers_1.Date_Helpers.formatDateYMDHIS(stop_display_time).substr(11, 5);
                let stop_time_css_class = "stop-time";
                if (stop_display_time < this.request_datetime) {
                    stop_time_css_class += " stop-time-passed";
                }
                const stop_time_s = '<span class="' + stop_time_css_class + '">' + stop_data.stop_name + ' (' + stop_display_time_s + ')</span>';
                stop_times_parts.push(stop_time_s);
            });
            const stop_times_s = stop_times_parts.join(' - ');
            table_row_tds.push('<td>' + stop_times_s + '</td>');
            const trip_row = '<tr>' + table_row_tds.join('') + '</tr>';
            const trip_has_rt_issues = !has_rt_info && !is_in_future;
            let should_show_trip = false;
            if (trip_has_rt_issues) {
                should_show_trip = true;
            }
            else {
                if (route_data.show_all_trips) {
                    should_show_trip = true;
                }
            }
            if (should_show_trip) {
                trips_html_rows.push(trip_row);
            }
        });
        const trips_table_rows_s = trips_html_rows.join("\n");
        const table_html = '<table class="table table-sm table-hover gtfs-trips"><thead><tr><th scope="col">ID</th><th scope="col" style="width: 300px;">TripID / RouteID</th><th scope="col" style="width: 100px;">GTFS-RT</th><th scope="col" class="align-middle" style="width: 150px;">Departure</th><th scope="col" class="align-middle">Stops</th></tr></thead><tbody>' + trips_table_rows_s + '</tbody></table>';
        route_html = route_html.replace('[TABLE_HTML]', table_html);
        const should_display_route = trips_html_rows.length > 0 || agency_data.show_all_trips;
        if (should_display_route) {
            // debugger;
            return route_html;
        }
        return null;
    }
}
exports.default = GTFS_RT_Reporter;

},{"../helpers/DOM_Helpers":4,"../helpers/Date_Helpers":5,"./../models/response_gtfs_static_query":7}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DOM_Helpers_1 = require("./../helpers/DOM_Helpers");
class Progress_Controller {
    constructor() {
        const el_id = 'app-progress';
        this.progress_status_el = document.getElementById(el_id);
    }
    setIdle() {
        DOM_Helpers_1.DOM_Helpers.removeClassName(this.progress_status_el, 'bg-primary progress-bar-striped progress-bar-animated');
        DOM_Helpers_1.DOM_Helpers.addClassName(this.progress_status_el, 'bg-success');
        this.progress_status_el.innerText = 'Idle';
    }
    setBusy(message) {
        DOM_Helpers_1.DOM_Helpers.removeClassName(this.progress_status_el, 'bg-success');
        DOM_Helpers_1.DOM_Helpers.addClassName(this.progress_status_el, 'bg-primary progress-bar-striped progress-bar-animated');
        this.progress_status_el.innerText = message;
    }
    setError(message) {
        DOM_Helpers_1.DOM_Helpers.removeClassName(this.progress_status_el, 'bg-primary progress-bar-striped progress-bar-animated');
        DOM_Helpers_1.DOM_Helpers.addClassName(this.progress_status_el, 'bg-danger');
        this.progress_status_el.innerText = message;
    }
}
exports.default = Progress_Controller;

},{"./../helpers/DOM_Helpers":4}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOM_Helpers = void 0;
class DOM_Helpers {
    static addClassName(dom_node, input_class_name) {
        const input_class_names = input_class_name.split(' ');
        input_class_names.forEach(class_name => {
            const class_names = dom_node.className.split(' ');
            const class_name_idx = class_names.indexOf(class_name);
            const has_class_name = class_name_idx !== -1;
            if (has_class_name) {
                return;
            }
            class_names.push(class_name);
            dom_node.className = class_names.join(' ');
        });
    }
    static removeClassName(dom_node, input_class_name) {
        const input_class_names = input_class_name.split(' ');
        input_class_names.forEach(class_name => {
            const class_names = dom_node.className.split(' ');
            const class_name_idx = class_names.indexOf(class_name);
            const has_class_name = class_name_idx !== -1;
            if (!has_class_name) {
                return;
            }
            class_names.splice(class_name_idx, 1);
            dom_node.className = class_names.join(' ');
        });
    }
    static hasClassName(el, class_name) {
        const has_class_name = el.className.indexOf(class_name) !== -1;
        return has_class_name;
    }
}
exports.DOM_Helpers = DOM_Helpers;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Date_Helpers = void 0;
class Date_Helpers {
    static formatDateYMDHIS(d) {
        const date_parts = [
            d.getFullYear(),
            '-',
            ('00' + (d.getMonth() + 1)).slice(-2),
            '-',
            ('00' + d.getDate()).slice(-2),
            ' ',
            ('00' + d.getHours()).slice(-2),
            ':',
            ('00' + d.getMinutes()).slice(-2),
            ':',
            ('00' + d.getSeconds()).slice(-2)
        ];
        return date_parts.join('');
    }
    static setHHMMToDate(d, hhmm) {
        const time_parts = hhmm.split(':');
        const time_hours = parseInt(time_parts[0]);
        const time_minutes = parseInt(time_parts[1]);
        const new_date = new Date(d.getTime());
        new_date.setHours(time_hours, time_minutes, 0, 0);
        return new_date;
    }
}
exports.Date_Helpers = Date_Helpers;

},{}],6:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GTFS_DB_Controller_1 = __importDefault(require("./controllers/GTFS_DB_Controller"));
const GTFS_RT_Reporter_1 = __importDefault(require("./controllers/GTFS_RT_Reporter"));
const Progress_Controller_1 = __importDefault(require("./controllers/Progress_Controller"));
const progress_controller = new Progress_Controller_1.default();
progress_controller.setIdle();
const gtfs_rt_reporter = new GTFS_RT_Reporter_1.default();
const gtfs_db_controller = new GTFS_DB_Controller_1.default();
gtfs_db_controller.progress_controller = progress_controller;
gtfs_db_controller.gtfs_rt_reporter = gtfs_rt_reporter;
gtfs_db_controller.load_resources(() => {
    console.log('loaded');
});

},{"./controllers/GTFS_DB_Controller":1,"./controllers/GTFS_RT_Reporter":2,"./controllers/Progress_Controller":3}],7:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GTFS_Static_Trip = void 0;
const Date_Helpers_1 = require("./../helpers/Date_Helpers");
const sphericalmercator_1 = __importDefault(require("@mapbox/sphericalmercator"));
class GTFS_Static_Trip {
    constructor(trip_id, stop_times, agency, route) {
        this.tripID = trip_id;
        const first_stop = stop_times[0];
        this.departureTime = first_stop.stop_departure || new Date();
        const last_stop = stop_times[stop_times.length - 1];
        this.arrivalTime = last_stop.stop_arrival || new Date();
        this.route = route;
        this.agency = agency;
        this.stop_times = stop_times;
        this.gtfsRT = null;
    }
    static initWithCondensedTrip(condensed_trip, agency, route, trip_day_midnight, map_gtfs_stops) {
        let stop_times = [];
        const stops_data = condensed_trip.stop_times_s.split(' -- ');
        stops_data.forEach((stop_data_s, idx) => {
            const is_first_stop = idx === 0;
            const is_last_stop = idx === stops_data.length - 1;
            const stop_data_parts = stop_data_s.split('|');
            const stop_id = stop_data_parts[0];
            let stop_arrival = null;
            if (!is_first_stop) {
                const arrival_s = stop_data_parts[1];
                stop_arrival = Date_Helpers_1.Date_Helpers.setHHMMToDate(trip_day_midnight, arrival_s);
            }
            let stop_departure = null;
            if (!is_last_stop) {
                const departure_s = stop_data_parts[2];
                stop_departure = Date_Helpers_1.Date_Helpers.setHHMMToDate(trip_day_midnight, departure_s);
            }
            const stop = map_gtfs_stops[stop_id];
            const stop_time = {
                stop: stop,
                stop_arrival: stop_arrival,
                stop_departure: stop_departure,
            };
            stop_times.push(stop_time);
        });
        const trip = new GTFS_Static_Trip(condensed_trip.trip_id, stop_times, agency, route);
        return trip;
    }
    isActive(interval_from, interval_to) {
        if (this.arrivalTime < interval_from) {
            return false;
        }
        if (this.departureTime > interval_to) {
            return false;
        }
        return true;
    }
    isFinished(request_time) {
        if (this.arrivalTime < request_time) {
            return true;
        }
        return false;
    }
    isInTheFuture(request_time) {
        if (this.arrivalTime === null || this.departureTime === null) {
            return true;
        }
        if (this.departureTime > request_time) {
            return true;
        }
        return false;
    }
    computeMapURL(request_time) {
        var webmercator = new sphericalmercator_1.default({
            size: 256
        });
        let stop_position = null;
        if (this.isInTheFuture(request_time)) {
            const stop_time = this.stop_times[0];
            stop_position = [
                stop_time.stop.stop_lon,
                stop_time.stop.stop_lat
            ];
        }
        if (this.isFinished(request_time)) {
            const stop_time = this.stop_times[this.stop_times.length - 1];
            stop_position = [
                stop_time.stop.stop_lon,
                stop_time.stop.stop_lat
            ];
        }
        if (stop_position === null) {
            // loop through the stops
            this.stop_times.forEach((stop_time_b, idx) => {
                if (stop_position) {
                    return;
                }
                const is_first_stop = idx === 0;
                const is_last_stop = idx === this.stop_times.length - 1;
                if (is_first_stop) {
                    return;
                }
                const stop_time_date = stop_time_b.stop_arrival;
                if (stop_time_date === null) {
                    return;
                }
                if (stop_time_date > request_time) {
                    const stop_time_a = this.stop_times[idx - 1];
                    if (stop_time_a.stop_departure == null) {
                        return;
                    }
                    const stop_time_ab = (stop_time_date.getTime() - stop_time_a.stop_departure.getTime()) / 1000;
                    const stop_time_ac = (request_time.getTime() - stop_time_a.stop_departure.getTime()) / 1000;
                    const delta_longitude_ab = stop_time_b.stop.stop_lon - stop_time_a.stop.stop_lon;
                    const delta_latitude_ab = stop_time_b.stop.stop_lat - stop_time_a.stop.stop_lat;
                    const delta_longitude_ac = stop_time_ac / stop_time_ab * delta_longitude_ab;
                    const delta_latitude_ac = stop_time_ac / stop_time_ab * delta_latitude_ab;
                    stop_position = [
                        stop_time_a.stop.stop_lon + delta_longitude_ac,
                        stop_time_a.stop.stop_lat + delta_latitude_ac
                    ];
                }
            });
        }
        if (stop_position === null) {
            return '';
        }
        const stop_mercator_point = webmercator.forward(stop_position);
        const stop_x = stop_mercator_point[0];
        const stop_y = stop_mercator_point[1];
        const zoom = 15;
        const url_address = 'https://maps2.trafimage.ch/ch.sbb.netzkarte?baselayers=ch.sbb.netzkarte,ch.sbb.netzkarte.dark,ch.sbb.netzkarte.luftbild.group,ch.sbb.netzkarte.landeskarte,ch.sbb.netzkarte.landeskarte.grau&display_srs=EPSG:2056&lang=de&layers=ch.sbb.puenktlichkeit-all,ch.sbb.netzkarte.buslinien&x=' + stop_x + '&y=' + stop_y + '&z=' + zoom;
        return url_address;
    }
}
exports.GTFS_Static_Trip = GTFS_Static_Trip;

},{"./../helpers/Date_Helpers":5,"@mapbox/sphericalmercator":8}],8:[function(require,module,exports){
var SphericalMercator = (function(){

// Closures including constants and other precalculated values.
var cache = {},
    EPSLN = 1.0e-10,
    D2R = Math.PI / 180,
    R2D = 180 / Math.PI,
    // 900913 properties.
    A = 6378137.0,
    MAXEXTENT = 20037508.342789244;

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}

// SphericalMercator constructor: precaches calculations
// for fast tile lookups.
function SphericalMercator(options) {
    options = options || {};
    this.size = options.size || 256;
    if (!cache[this.size]) {
        var size = this.size;
        var c = cache[this.size] = {};
        c.Bc = [];
        c.Cc = [];
        c.zc = [];
        c.Ac = [];
        for (var d = 0; d < 30; d++) {
            c.Bc.push(size / 360);
            c.Cc.push(size / (2 * Math.PI));
            c.zc.push(size / 2);
            c.Ac.push(size);
            size *= 2;
        }
    }
    this.Bc = cache[this.size].Bc;
    this.Cc = cache[this.size].Cc;
    this.zc = cache[this.size].zc;
    this.Ac = cache[this.size].Ac;
};

// Convert lon lat to screen pixel value
//
// - `ll` {Array} `[lon, lat]` array of geographic coordinates.
// - `zoom` {Number} zoom level.
SphericalMercator.prototype.px = function(ll, zoom) {
  if (isFloat(zoom)) {
    var size = this.size * Math.pow(2, zoom);
    var d = size / 2;
    var bc = (size / 360);
    var cc = (size / (2 * Math.PI));
    var ac = size;
    var f = Math.min(Math.max(Math.sin(D2R * ll[1]), -0.9999), 0.9999);
    var x = d + ll[0] * bc;
    var y = d + 0.5 * Math.log((1 + f) / (1 - f)) * -cc;
    (x > ac) && (x = ac);
    (y > ac) && (y = ac);
    //(x < 0) && (x = 0);
    //(y < 0) && (y = 0);
    return [x, y];
  } else {
    var d = this.zc[zoom];
    var f = Math.min(Math.max(Math.sin(D2R * ll[1]), -0.9999), 0.9999);
    var x = Math.round(d + ll[0] * this.Bc[zoom]);
    var y = Math.round(d + 0.5 * Math.log((1 + f) / (1 - f)) * (-this.Cc[zoom]));
    (x > this.Ac[zoom]) && (x = this.Ac[zoom]);
    (y > this.Ac[zoom]) && (y = this.Ac[zoom]);
    //(x < 0) && (x = 0);
    //(y < 0) && (y = 0);
    return [x, y];
  }
};

// Convert screen pixel value to lon lat
//
// - `px` {Array} `[x, y]` array of geographic coordinates.
// - `zoom` {Number} zoom level.
SphericalMercator.prototype.ll = function(px, zoom) {
  if (isFloat(zoom)) {
    var size = this.size * Math.pow(2, zoom);
    var bc = (size / 360);
    var cc = (size / (2 * Math.PI));
    var zc = size / 2;
    var g = (px[1] - zc) / -cc;
    var lon = (px[0] - zc) / bc;
    var lat = R2D * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
    return [lon, lat];
  } else {
    var g = (px[1] - this.zc[zoom]) / (-this.Cc[zoom]);
    var lon = (px[0] - this.zc[zoom]) / this.Bc[zoom];
    var lat = R2D * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
    return [lon, lat];
  }
};

// Convert tile xyz value to bbox of the form `[w, s, e, n]`
//
// - `x` {Number} x (longitude) number.
// - `y` {Number} y (latitude) number.
// - `zoom` {Number} zoom.
// - `tms_style` {Boolean} whether to compute using tms-style.
// - `srs` {String} projection for resulting bbox (WGS84|900913).
// - `return` {Array} bbox array of values in form `[w, s, e, n]`.
SphericalMercator.prototype.bbox = function(x, y, zoom, tms_style, srs) {
    // Convert xyz into bbox with srs WGS84
    if (tms_style) {
        y = (Math.pow(2, zoom) - 1) - y;
    }
    // Use +y to make sure it's a number to avoid inadvertent concatenation.
    var ll = [x * this.size, (+y + 1) * this.size]; // lower left
    // Use +x to make sure it's a number to avoid inadvertent concatenation.
    var ur = [(+x + 1) * this.size, y * this.size]; // upper right
    var bbox = this.ll(ll, zoom).concat(this.ll(ur, zoom));

    // If web mercator requested reproject to 900913.
    if (srs === '900913') {
        return this.convert(bbox, '900913');
    } else {
        return bbox;
    }
};

// Convert bbox to xyx bounds
//
// - `bbox` {Number} bbox in the form `[w, s, e, n]`.
// - `zoom` {Number} zoom.
// - `tms_style` {Boolean} whether to compute using tms-style.
// - `srs` {String} projection of input bbox (WGS84|900913).
// - `@return` {Object} XYZ bounds containing minX, maxX, minY, maxY properties.
SphericalMercator.prototype.xyz = function(bbox, zoom, tms_style, srs) {
    // If web mercator provided reproject to WGS84.
    if (srs === '900913') {
        bbox = this.convert(bbox, 'WGS84');
    }

    var ll = [bbox[0], bbox[1]]; // lower left
    var ur = [bbox[2], bbox[3]]; // upper right
    var px_ll = this.px(ll, zoom);
    var px_ur = this.px(ur, zoom);
    // Y = 0 for XYZ is the top hence minY uses px_ur[1].
    var x = [ Math.floor(px_ll[0] / this.size), Math.floor((px_ur[0] - 1) / this.size) ];
    var y = [ Math.floor(px_ur[1] / this.size), Math.floor((px_ll[1] - 1) / this.size) ];
    var bounds = {
        minX: Math.min.apply(Math, x) < 0 ? 0 : Math.min.apply(Math, x),
        minY: Math.min.apply(Math, y) < 0 ? 0 : Math.min.apply(Math, y),
        maxX: Math.max.apply(Math, x),
        maxY: Math.max.apply(Math, y)
    };
    if (tms_style) {
        var tms = {
            minY: (Math.pow(2, zoom) - 1) - bounds.maxY,
            maxY: (Math.pow(2, zoom) - 1) - bounds.minY
        };
        bounds.minY = tms.minY;
        bounds.maxY = tms.maxY;
    }
    return bounds;
};

// Convert projection of given bbox.
//
// - `bbox` {Number} bbox in the form `[w, s, e, n]`.
// - `to` {String} projection of output bbox (WGS84|900913). Input bbox
//   assumed to be the "other" projection.
// - `@return` {Object} bbox with reprojected coordinates.
SphericalMercator.prototype.convert = function(bbox, to) {
    if (to === '900913') {
        return this.forward(bbox.slice(0, 2)).concat(this.forward(bbox.slice(2,4)));
    } else {
        return this.inverse(bbox.slice(0, 2)).concat(this.inverse(bbox.slice(2,4)));
    }
};

// Convert lon/lat values to 900913 x/y.
SphericalMercator.prototype.forward = function(ll) {
    var xy = [
        A * ll[0] * D2R,
        A * Math.log(Math.tan((Math.PI*0.25) + (0.5 * ll[1] * D2R)))
    ];
    // if xy value is beyond maxextent (e.g. poles), return maxextent.
    (xy[0] > MAXEXTENT) && (xy[0] = MAXEXTENT);
    (xy[0] < -MAXEXTENT) && (xy[0] = -MAXEXTENT);
    (xy[1] > MAXEXTENT) && (xy[1] = MAXEXTENT);
    (xy[1] < -MAXEXTENT) && (xy[1] = -MAXEXTENT);
    return xy;
};

// Convert 900913 x/y values to lon/lat.
SphericalMercator.prototype.inverse = function(xy) {
    return [
        (xy[0] * R2D / A),
        ((Math.PI*0.5) - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D
    ];
};

return SphericalMercator;

})();

if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
    module.exports = exports = SphericalMercator;
}

},{}]},{},[6]);
