#!/usr/bin/node
// This line of the file makes this file easily executable from the command line.
// Rather than running 'node ${filename}, the user need only make the file executable once
// (chmod +x ${filename}) then can run the file wih ./${filename} (or can add the file to 
// the user's 'bin' folder to permit execution from anywhere as the user).'

/**
 * HTML Degree Audit parser built for Northeastern University's degree audit.
 * By Jacob Chvatal for Northeastern Sandbox.
 *
 * Filters through a Northeastern degree audit, extracting its relevant information
 * to an easy to work with JSON file tracking major, graduation date,
 * classes and NUPaths taken and in progress as well as requirements to take.
 */

// The FileStream library
const fs = require('fs');

// location of the input file
const INPUT = '../test/mock_audits/cs_audit.html';

// location of the output file
const OUTPUT = 'parsed_audit.json';

/**
 * Gets the major associated with this degree audit.
 * @param {JSON}   json  The json file to which the major should be added.
 * @param {String} line  The line at which the major can be found.
 */
function identify_major(json, line) {
    json.data.major = line.substring(line.search('\">') + 2, line.search(' - Major')); 
}

/**
 * Gets the year this degree audit was created.
 * @param {JSON} json  The json file to which the major should be added.
 * @param {String}     The line containing the year.
 */
function get_year(json, line) {
    json.data.year = line.substring(line.search('CATALOG YEAR:') + 'CATALOG YEAR: '.length, line.search('CATALOG YEAR:') + 'CATALOG YEAR: '.length + 4);
}

/**
 * Gets the expected graduation date of the degree audit.
 * @param {JSON} json  The json file to which this graduation date should be added.
 * @param {String} line The line which contains the graduation date desired.
 */
function get_grad_date(json, line) {
    json.data.grad = line.substring(line.search('GRADUATION DATE: ') + 'GRADUATION DATE: '.length, line.search('GRADUATION DATE: ') + 'GRADUATION DATE:  '.length + 7);
}

/**
 * Gets the NUPaths associated with this degree audit.
 * @param {JSON} json     The json file to which the NUPaths should be added.
 * @param {String} lines  The lines to be scanned for the NUPaths.
 * @param {Integer} i     The index of the line at which we currently stand.
 */
function get_nupaths(json, lines, i) {
    i++;
    // while there is another line with another listed NUPath (they alone use the HTML tag)
    while(contains(lines[i], '<br>')) {
        let toAdd = lines[i].substring(lines[i].indexOf("(") + 1, lines[i].indexOf("(") + 3)

        // gets the NUPath abbreviation, omitting other information and unwanted HTML tags
        if(contains(toAdd, '<') || contains(toAdd, '>')) {
            return;
        }

        else if(contains(lines[i], '>OK ') && !json.completed.nupaths.includes(toAdd)) {
            json.completed.nupaths.push(toAdd);				
        }
        else if(contains(lines[i], '>IP ') && !json.inprogress.nupaths.includes(toAdd)) {
            json.inprogress.nupaths.push(toAdd);
        }
        else if(contains(lines[i], '>NO ') && !json.requirements.nupaths.includes(toAdd)) {
            json.requirements.nupaths.push(toAdd);				
        }
        i++;
    }
}

/**
 * Determines whether a function contains a number.
 * @param {String} n  The String which could contain a number.
 * https://stackoverflow.com/questions/5778020/check-whether-an-input-string-contains-a-number-in-javascript#28813213
 */
function hasNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Adds the courses required by the degree audit to be taken to the JSON.
 * @param {JSON} json  	 The json file to which the required courses should be added.
 * @param {String} line  The line which contains these required courses.
 */
function add_courses_to_take(json, lines, j, subjectType) {
    let courseList = lines[j].substring(lines[j].search('Course List') + 13).replace(/<font>/g, '').replace(/<font class="auditPreviewText">/g, '').replace(/\*\*\*\*/g, '').replace(/\s/g, '').split('</font>');

    // last two elements are always empty, as each of these lines ends with two </font> tags
    courseList.pop();
    courseList.pop();

    let type = subjectType;
    let courses = [];
    let seenEnumeration = false;
    for(let i = 0; i < courseList.length; i++) {
        let course = { };

        // called on next line to pick up future courses if relevant
        if(contains(courseList[i],'&amp;')) {
            add_courses_to_take(json, lines, j + 1, type);
        }

        // remove the potential and sign
        courseList[i] = courseList[i].replace(/&amp;/g, '');

        // if the course is not empty [ it contains some info ]
        if(!(courseList[i] === '')) {

            let maybeCourseNumber = courseList[i].substring(0, 4);

            // THREE CASES
            // IT'S A NUMBER: IT IS A COURSE WITH THE PREVIOUS TYPE LISTED, use the type as previously defined'
            if(!isNaN(maybeCourseNumber)) {
                course.subject = type;

                // determines whether we're looking at an enumeration (list of required courses of which 1+ should be taken)
                if(contains(lines[j - 1], ' of the following courses')) {

                    if(courses[courses.length - 1].list == null) {
                        courses[courses.length - 1].list = [courses[courses.length - 1].classId, maybeCourseNumber];
                        courses[courses.length - 1].num_required = lines[j - 1].substring(lines[j - 1].search('Complete') + 'Complete ('.length, lines[j - 1].search('Complete') + 'Complete ('.length+1); 
                        delete courses[courses.length - 1].classId;

                    } else {
                        courses[courses.length - 1].list.push(maybeCourseNumber);
                    }

                } else if(contains(lines[j - 2], ' of the following courses')) { 

                    // there is always a line of white space after course requirements, so picking up a course number
                    // from a line two previous to this one is not an issue
                    if(courses[courses.length - 1].list == null) {
                        courses[courses.length - 1].list = [courses[courses.length - 1].classId, maybeCourseNumber];
                        courses[courses.length - 1].num_required = lines[j - 2].substring(lines[j - 2].search('Complete') + 'Complete ('.length, lines[j - 2].search('Complete') + 'Complete ('.length+1); 
                        delete courses[courses.length - 1].classId;
                    } else {
                        courses[courses.length - 1].list.push(maybeCourseNumber);
                    }

                    // else, it is another required course with the previous type
                } else {
                    course.classId = maybeCourseNumber;
                    course.subject = type;
                    courses.push(course);
                }
            }

            // ITS 'TO12' OR TO AND 2 NUMBERS: a range of courses
            else if(maybeCourseNumber.substring(0, 2) === 'TO') {
                courses[courses.length - 1].classId2 = courseList[i].substring(2, 7);
            }

            // its part of a course name along with part of the number (e.g. ENGL or CS10))
            else {
                let subjEnd = 4;
                while(contains(maybeCourseNumber.substring(0, subjEnd), '[0-9]')) {
                    subjEnd = subjEnd - 1;
                }

                type = maybeCourseNumber.substring(0, subjEnd);
                course.subject = type;
                course.classId = courseList[i].substring(subjEnd, subjEnd + 4);
                courses.push(course);
            }
        }
    }
    json.requirements.classes = [].concat(json.requirements.classes, courses);
}

/**
 * Adds the courses taken so far to the current JSON file.
 * @param {JSON} json 	 The JSON file to which the courses to be taken should be added.
 * @param {String} line  The line which contains the course taken.
 */
function add_course_taken(json, line) {
    let course = {};
    let courseString = line.substring(line.search('(FL|SP|S1|S2|SM)'));
    course.hon = contains(line, '\(HON\)');

    // ap courses that do not count for credit do not count for corresponding college courses
    if(contains(courseString, '(NO AP|NO IB)')) {
        return;
    }    

    course.subject = line.substring(line.search('(FL|SP|S1|S2|SM)') + 5, line.search('(FL|SP|S1|S2|SM)') + 9).replace(' ', '').replace(' ', '');
    course.classId = courseString.substring(9, 13);

    // locates the rest of the parameters with some regex magic
    course.credithours = courseString.substring(18, 22);
    course.season = new RegExp('(FL|SP|S1|S2|SM)').exec(line)[0];
    course.year = line.substring(line.search('(FL|SP|S1|S2|SM)') + 2, line.search('(FL|SP|S1|S2|SM)') + 4);

    course.termId = get_termid(course.season, course.year);
    // determines whether the course is 'in progress' or completed and sorts accordingly

    if(isNaN(course.classId) || course.classId == null || isNaN(course.credithours) || course.credithours == null) {
        return; 
        // not a valid course if the course id is not a number
    }

    if(contains(courseString, 'IP')) {
        if(!contains_course(json.inprogress.classes, course)) {
            json.inprogress.classes.push(course);			
        } 
    } else {
        if(!contains_course(json.completed.classes, course)) {
            json.completed.classes.push(course);    
        }
    }
}

/**
 * Determines the termId parameter of a course with the season and year of the course.
 * @param {String} season   The season of the course ('FL', 'SP', 'S1', 'S2', 'SM')
 * @param {int} year        The year during which the course occurs (i.3. 2018, 2019)
 * @return {int}            A six-digit integer representing the termId.
 * @throws err              if the given year is not part of the enumeration specified.
 */
function get_termid(season, year) {
    // Makes the assumption that all years will be in the 21st century
    // As different technology will likely be used in 81 years, this is a valid assumption
    let termid = "20" + year;
    switch(season) {
        case "FL": 
            // Fall term: associated year is the same year as the following 
            // Spring term as per SearchNEU conventions
            termid = "20" + Number(Number(year) + 1);
            return termid + "10";
        case "SP": // Spring term
            return termid + "30";
        case "S1": // Summer 1 term
            return termid + "40";
        case "S2": // Summer 2 term
            return termid + "60";
        case "SM": // Full Summer term (typically reserved for graduate courses)
            return termid + "50";
        default:
            throw "The given season was not a member of the enumeration required."
    }
}

/**
 * Converts an HTML degree audit file to a JSON file organizing the relevant information within.
 * @param {String} data     The data contained within a 'Degree Audit.html' input file.
 */
function audit_to_json(data) {

    json = { 
        completed: {
            classes:[],
            nupaths:[]
        },
        inprogress: {
            classes:[],
            nupaths:[]
        },
        requirements: {
            classes:[],
            nupaths:[]
        },
        data: {

        }
    };
    // iterat line by line, identifying characteristics of the degree audit to
    // begin looking for specific elements of the degree audit to parse to JSON format if present
    let lines = data.split('\n');
    for(let i = 0; i < lines.length; i++) {

        // finds major
        if(contains(lines[i], 'Major')) {
            identify_major(json, lines[i]);
        } 

        // finds year
        else if(contains(lines[i], 'CATALOG YEAR')) {
            get_year(json, lines[i]);
        }

        // finds graduation date
        else if(contains(lines[i], 'GRADUATION DATE:')) {
            get_grad_date(json, lines[i]);	
        }

        // finds all of the nupaths
        else if(contains(lines[i], 'No course taken pass/fail can be used toward NUpath.'))	{
            get_nupaths(json, lines, i);
        }

        // finds all of the courses required to be taken
        else if(contains(lines[i], 'Course List')) {
            add_courses_to_take(json, lines, i);
        }

        // finds courses that have been taken
        else if(contains(lines[i], '(FL|SP|S1|S2|SM)')) {
            add_course_taken(json, lines[i]);
        }
    }

    return json;
}


/**
 * Determines whether a line of text contains a pattern to match.
 * @param {String} text			The text which may contain the pattern.
 * @param {String, REGEX} lookfor	The text to match or pattern to look for in the code.
 * @return {Boolean} 	True if the text contains or matches lookfor, false otherwise.
 */
function contains(text, lookfor) {
    return -1 != text.search(lookfor);
}

/**
 * Determines whether an array already contains a course.
 * Two courses are the same when they have the same subject, classId (e.g. CS1200), and are taken during the same term (e.g. 201810)
 * @param {Array} arr   The array of courses which could contain the course.
 * @param {JavaScript object}  The course which could be in the array.
 * @return whether the array contains the course.
 */
function contains_course(arr, course) {
    for(let i = 0; i < arr.length; i++) {
        if(arr[i].classId === course.classId && arr[i].subject === course.subject && arr[i].termId === course.termId) { 
            return true;
        }
    }

    return false;
}

// prints out the requirements to ensure they are in the correct format

// functions to export for testing
module.exports.audit_to_json = audit_to_json;
