
/*
AUTHOR: NIANXU
DATE:2017/08/09
*/
define(['jquery', 'moment', 'template'],function($, moment, template) {

    function filled(num) {
        if(num.toString().length < 2)
            return '0'+num;
        else {
            return num;
        }
    }
    function IE8FixedDate(dateStr) {
        if(typeof dateStr == 'object')
            return dateStr;
        else if(typeof dateStr == 'string' && !isNaN(new Date(dateStr)))
            return new Date(dateStr);

        var isoExp = /^\s*(\d{4})-(\d\d)-(\d\d)\s*$/;//正则
        var date = new Date(NaN);
        var parts = isoExp.exec(dateStr);//正则验证
        if(parts) {
            var month = Number(parts[2]);
            //设置时间
            date.setFullYear(parts[1], month - 1, parts[3]);
            //判断是否正确
            if(month != date.getMonth() + 1) {
                date.setTime(NaN);
            }
        }
        return date;
    }
    function siblingMonth(date, director) {
        if(typeof date == 'string') date = IE8FixedDate(date);
        var iYear = date.getFullYear(); // 当前年
        var iMonth = date.getMonth() + director; // 当前月
        return new Date(iYear, iMonth, 1);
    }
    function format(d, pattern) {
        pattern = pattern || 'yyyy-MM-dd';
        var y = d.getFullYear().toString(),
            o = {
                M: d.getMonth() + 1,
                d: d.getDate(),
                h: d.getHours(),
                m: d.getMinutes(),
                s: d.getSeconds()
            };
        pattern = pattern.replace(/(y+)/ig, function(a, b) {
            return y.substr(4 - Math.min(4, b.length));
        });
        for (var i in o) {
            pattern = pattern.replace(new RegExp('(' + i + '+)', 'g'), function(a, b) {
                return (o[i] < 10 && b.length > 1) ? '0' + o[i] : o[i];
            });
        }
        return pattern;
    }
    function transformDate(date) {
        if(!date)
            date = new Date;
        else if(typeof date == 'string')
            date = IE8FixedDate(date);
        var y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
        return new Date(y,m,d);
    }

    var datepickerTemplate =
    "<div class='datepicker-months'>" +
    "<div class='datepicker-controls'>" +
        "<div class='datepicker-control-button'>" +
            "<a href='javascript:;' class='datepicker-previous-button'>往前</a>" +
        "</div>" +
        "<div class='datepicker-control-month'>${year}年 ${month}</div>" +
        "{@if monthsIn == 1}" +
        "<div class='datepicker-control-button rightalign'>" +
            "<a href='javascript:;' class='datepicker-next-button'>往后</a>" +
        "</div>" +
        "{@/if}" +
    "</div>" +
    "<table class='datepicker-table' border='0' cellspacing='0' cellpadding='0'>" +
        "<thead>" +
            "<tr class='datepicker-header-days'>" +
            "{@each daysOfTheWeek as weekDay}" +
                "<th class='datepicker-header-day'>${weekDay}</th>" +
            "{@/each}" +
            "</tr>" +
        "</thead>" +
        "<tbody>" +

        "{@each i in range(0, numberOfRows)}" +
            "<tr>" +
            "{@each j in range(0, 7)}" +
                "<td class='${days[j+i*7].classes}' data-date='${days[j+i*7].date}'>" +
                    "${days[j+i*7].day}" +
                "</td>" +
            "{@/each}" +
            "</tr>" +
        "{@/each}" +
        "</tbody>" +
    "</table>" +
    "</div>" +
    "{@if monthsIn == 2}" +

    "<div class='datepicker-months'>" +
    "<div class='datepicker-controls'>" +
        "<div class='datepicker-control-month'>${nextYear}年 ${nextMonth}</div>" +
        "<div class='datepicker-control-button datepicker-control-button-right'>" +
            "<a href='javascript:;' class='datepicker-next-button'>往后</a>" +
        "</div>" +
    "</div>" +
    "<table class='datepicker-table' border='0' cellspacing='0' cellpadding='0'>" +
        "<thead>" +
            "<tr class='datepicker-header-days'>" +
            "{@each daysOfTheWeek as weekDay}" +
                "<th class='datepicker-header-day'>${weekDay}</th>" +
            "{@/each}" +
            "</tr>" +
        "</thead>" +
        "<tbody>" +

        "{@each i in range(0, numberOfRows)}" +
            "<tr>" +
            "{@each j in range(0, 7)}" +
                "<td class='${nextDays[j+i*7].classes}' data-date='${nextDays[j+i*7].date}'>" +
                    "${nextDays[j+i*7].day}" +
                "</td>" +
            "{@/each}" +
            "</tr>" +
        "{@/each}" +
        "</tbody>" +
    "</table>" +
    "</div>" +

    "{@/if}";

    var defaults = {
        weekOffset: 0,
        daysOfTheWeek: ['日', '一', '二', '三', '四', '五', '六'],
        months : ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        monthsIn: 2,
        max: new Date(2099,0,1),
        min: new Date(1999,0,1),
        moment: null,
        offsetTop: 3,
        selected: null
    }
    var VALIDCLASS = 'datepicker-day',
        PASTCLASS = 'datepicker-day-past',
        TODAYCLASS = 'datepicker-day-today',
        INVALIDCLASS = 'datepicker-day-invalid',
        SELECTEDCLASS = 'datepicker-day-selected',
        HOVERCLASS  ='datepicker-day-hover';

    var __CACHE = [];
    function DatePicker(element, options) {
        this.element = element;
        this.options = $.extend(true, {}, defaults, options);
        if (this.options.moment) {
            moment = this.options.moment;
        }
        this._defaults = defaults;

        this.min = this.options.min;
        this.max = this.options.max;
        if(this.min.datePicker) this.min = transformDate(this.min.selectedDate);

        this.selectedDate = this.options.selected;

        if(!this.selectedDate)
            this.currentDate = new Date;
        else if (typeof this.selectedDate == 'string')
            this.currentDate = transformDate(this.selectedDate);
        else
            this.currentDate = this.selectedDate;

        this.init();
        __CACHE.push(this);
    }
    DatePicker.prototype.datePicker = true;
    DatePicker.prototype.init = function() {

        if (typeof template === 'undefined') {
            throw new Error("Template was not found.");
        } else {
            this.compiledTemplate = template(datepickerTemplate);
        }

        if(this.selectedDate)
            this.element.val(format(this.selectedDate));

        var offset = this.element.offset();
        var height = this.element.outerHeight() + this.options.offsetTop;

        this.container = $("<div class='datepicker'></div>");
        this.container.css('position', 'absolute');
        this.container.css('left', offset.left+'px');
        this.container.css('top', offset.top+height+'px');

        if(this.options.monthsIn == 2)
            this.container.addClass('datepicker-multi');

        $('body').append(this.container);

        var cDate = this.selectedDate || new Date;
        this.year = cDate.getFullYear();
        this.month = cDate.getMonth();
        this.render();
        this.bindEvents();

        if (this.options.ready) {
            this.options.ready.apply(this, []);
        }

    }
    DatePicker.prototype.bindEvents = function () {
        var _self = this;
        this.element.on('click', function(evt) {
            for(var i = 0, len=__CACHE.length;i<len;i++) {
                if(_self !== __CACHE[i])
                    __CACHE[i].hide();
            }
            evt.stopPropagation();
            _self.container.toggle();
        })
        this.container.on('click', function(evt) {
            evt.stopPropagation();
        })
        this.container.on('click', '.datepicker-previous-button', function() {
            _self.currentDate = siblingMonth(_self.currentDate, -1);
            _self.render();
        })
        this.container.on('click', '.datepicker-next-button', function() {
            _self.currentDate = siblingMonth(_self.currentDate, 1);
            _self.render();
        })
        this.container.on('click', '.datepicker-day', function() {

            var date = $(this).attr('data-date');
            _self.element.val(date);
            _self.selectedDate = transformDate(date);

            if(_self.options.range) {
                _self.setRangeHover(_self.min, date);
            }

            _self.container.find('td').removeClass(SELECTEDCLASS);
            $(this).addClass(SELECTEDCLASS);

            _self.hide();
            if(_self.options.onSelect) _self.options.onSelect(date);

        })
        $('body').on('click', function() {
            _self.hide();
        })
        if(this.options.range){
            var timer;
            this.container.on('mouseover', '.datepicker-day', function() {
                var TD = this, ins = _self;
                timer && clearTimeout(timer);
                timer = setTimeout(function() {
                    ins.setRangeHover(ins.min, TD.getAttribute('data-date'));
                }, 100)
            })
        }
    }
    DatePicker.prototype.createDays = function(next) {

        var cdate = this.currentDate;
        if(typeof cdate == 'string') cdate = IE8FixedDate(cdate);
        if(next) {
            cdate = siblingMonth(this.currentDate, 1);
        }
        var iYear = cdate.getFullYear(); // 当前年
        var iMonth = cdate.getMonth(); // 当前月
        var firstDays = new Date(iYear, iMonth, 1).getDay(); // 当前月第一天星期几
        var monthDays = new Date(iYear, iMonth + 1, 0).getDate(); // 当前月共多少天

        var today = new Date(), min = this.min, max = this.max, selected = this.selectedDate;

        var days_array = [];
        var monthsData = [];

        // 上个月补位
        for (; firstDays--;) {
            days_array.push(0);
        }
        for (var i = 1; i <= monthDays; i++) {
            days_array.push(i);
        }

        // 行数
        var rows = Math.ceil(days_array.length / 7);
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j <= 6; j++) {
                var days = days_array[j + 7 * i] || '';
                var date = days ? iYear + '-' + filled(iMonth+1) + '-' + filled(days) : '';
                var isPast = false;
                var isToday = false;
                var isValid = true;
                var isSelected = false;
                if(days) {
                    isPast = (new Date(iYear, iMonth, days) * 1 - transformDate(min) * 1 < 0 ) || (new Date(iYear, iMonth, days) * 1 - transformDate(max) * 1 > 0 );
                    isToday = (new Date(iYear, iMonth, days) * 1 - transformDate(today) * 1 == 0 );
                    if(selected)
                        isSelected = (new Date(iYear, iMonth, days) * 1 - transformDate(selected) * 1 == 0 );
                } else {
                    isValid = false;
                }

                var classes = [];
                if(isToday) classes.push(TODAYCLASS);
                if(isSelected) classes.push(SELECTEDCLASS);
                if(!isValid) {
                    classes.push(INVALIDCLASS);
                } else {
                    if(isPast){
                        classes.push(PASTCLASS);
                    }else{
                        classes.push(VALIDCLASS);
                    }
                }
                monthsData.push({
                    'day': days,
                    'date': date,
                    //'holiday': holidays[date] || false,
                    'classes' : classes.join(' ')
                })
            }
        }
        return monthsData;
    }

    DatePicker.prototype.render = function () {
        var cDate = this.currentDate;
        if(typeof cDate == 'string') cDate = IE8FixedDate(cDate);
        this.year = cDate.getFullYear();
        this.month = cDate.getMonth();
        this.container.empty();

        var days = this.createDays();
        var data = {
            month: this.options.months[this.month],
            year: this.year,
            daysOfTheWeek: this.options.daysOfTheWeek,
            numberOfRows: Math.ceil(days.length / 7),
            days: days,
            monthsIn: this.options.monthsIn
        };
        if(this.options.monthsIn == 2) {
            data.nextMonth = this.options.months[siblingMonth(this.currentDate, 1).getMonth()];
            data.nextYear = siblingMonth(this.currentDate, 1).getFullYear();
            data.nextDays =this.createDays('next');
        }
        this.container.html(this.compiledTemplate.render(data));
    }
    DatePicker.prototype.show = function(refresh) {
        if(refresh) this.render();
        this.container.show();
    }
    DatePicker.prototype.hide = function() {
        this.container.hide();
    }
    DatePicker.prototype.setRangeHover = function(start, end) {
        var startDate = IE8FixedDate(start)*1, endDate = IE8FixedDate(end)*1;
        var TDs = this.container.find('td'), len = TDs.length;
        for(var i=0;i<len;i++) {
            if(!TDs[i].getAttribute('data-date')) continue;
            var mills = IE8FixedDate(TDs[i].getAttribute('data-date'))*1;
            if(mills >= startDate && mills <= endDate){
                $(TDs[i]).addClass(HOVERCLASS);
            } else {
                $(TDs[i]).removeClass(HOVERCLASS);
            }
        }
    }

    $.fn.datePicker = function (options) {
        var dpInstance;

        if (this.length > 1) {
            throw new Error("Make sure your selector returns only one element.");
        }

        if (!this.length) {
            throw new Error("Cannot be instantiated on an empty selector.");
        }

        if (!this.data('plugin_datePicker')) {
            dpInstance = new DatePicker(this, options);
            this.data('plugin_datePicker', dpInstance);
            return dpInstance;
        }

        return this.data('plugin_datePicker');
    };


})
