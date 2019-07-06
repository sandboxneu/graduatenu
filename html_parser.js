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
const INPUT = '../Web\ Audit.html';

// location of the output file
const OUTPUT = 'parsed_audit.json';

/**
 * Gets the major associated with this degree audit.
 * @param {JSON}   json  The json file to which the major should be added.
 * @param {String} line  The line at which the major can be found.
 */
function identify_major(json, line) {
	json.data.major = line.substring(line.search('>') + 1, line.search(' - Major'));
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
		}

		else if(contains(lines[i], 'OK')|| contains(lines[i], 'IP')) {
			json.completed.nupaths.push(toAdd);				
		}
		else if(contains(lines[i], 'IP')) {
			json.inprogress.nupaths.push(toAdd);
		}
		else if(contains(lines[i], 'NO')) {
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
function add_courses_to_take(json, lines, j) {
	let courseList = lines[j].substring(lines[j].search('Course List') + 13).replace('<font>', '').split('<font class="auditPreviewText">').join('').split('</font>');
	let type = '';
	let courses = [];
	let seenEnumeration = false;
	for(let i = 0; i < courseList.length; i++) {
		let course = { };

		// excludes empty spaces and wildcard characters from course list
		if(!(courseList[i] == ' ' || courseList[i] == '' || courseList[i] == '****')) {
			course.subject = courseList[i].substring(0, 4).split(' ').join('');

			// determines whether we're looking at an enumeration (list of required courses of which 1+ should be taken)
			if(contains(lines[j - 1], ' of the following courses')) {
				// if the enumeration has not been seen before, create a new course
				if(!seenEnumeration) {
					course.list = [courseList[i].substring(4, 10)];
					course.num_required = lines[j - 1].substring(lines[j - 1].search('Complete') + 'Complete ('.length, lines[j - 1].search('Complete') + 'Complete ('.length+1) 
					seenEnumeration = true;
					courses.push(course);
					// if the enumeration has not been seen before, add this course's number to the course
				} else {
					courses[courses.length - 1].list.push(courseList[i].substring(1, 5));
				}
			} 

			// if the written subject was actually a number, the course was referencing the subject provided by a previous line 
			// and as such did not restate the subject
			else if(hasNumber(course.subject)) {
				course.classId = courseList[i].substring(0, 5).split(' ').join('');
				course.subject = type;
				courses.push(course);
			} 

			// finds the latter of a defined course range; the course can be any course within a range
			else if(course.subject == 'TO') {
				courses[courses.length - 1].classId2 = courseList[i].substring(4, 10);	
			} 

			// the course is (likely) a standard course, create it with the expected information
			else {
				type = course.subject;
				course.classId = courseList[i].substring(4, 10);	
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
	let courseString = line.substring(line.search('(FL|SP|S1|S2)'));
	course.hon = contains(line, '\(HON\)');

	// ap courses that do not count for credit do not have numbers / attributes for corresponding college courses
	if(!contains(courseString, 'NO AP')) {
		course.subject = line.substring(line.search('(FL|SP|S1|S2)') + 5, line.search('(FL|SP|S1|S2)') + 9).replace(' ', '');
		course.classId = courseString.substring(9, 14);
	}

	// locates the rest of the parameters with some regex magic
	course.credithours = courseString.substring(18, 22);
	course.season = new RegExp('(FL|SP|S1|S2)').exec(line)[0];
    course.year = line.substring(line.search('(FL|SP|S1|S2)') + 2, line.search('(FL|SP|S1|S2)') + 4);

    course.termId = get_termid(course.season, course.year);
	// determines whether the course is 'in progress' or completed and sorts accordingly
	if(contains(courseString, 'IP')) {
		json.inprogress.classes.push(course);			
	} else {
		json.completed.classes.push(course);
    }
    console.log(course);
}

/**
 * Determines the termId parameter of a course with the season and year of the course.
 * @param {String} season   The season of the course ('FL', 'SP', 'S1', 'S2')
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
            return termid + "40";
        case "SP":
            return termid + "10";
        case "S1":
            return termid + "20";
        case "S2":
            return termid + "30";
        default:
            throw "The given season was not a member of the enumeration required."
    }
}

/**
 * Converts an HTML degree audit file to a JSON file organizing the relevant information within.
 * @param {String} input     The local location of the 'Degree Audit.html' input file.
 * @param {String} output    The file path(including file name) where the degree audit should be written to.
 */
function audit_to_json(input, output) {
	fs.readFile(input, 'utf8', (err, data) => {
		if(err) {throw err;}
		// else, process the data

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
			else if(contains(lines[i], 'FL') || contains(lines[i], 'SP') ||contains(lines[i], 'S1') || contains(lines[i], 'S2')) {
				add_course_taken(json, lines[i]);
			}
		}

		// prints out the requirements to ensure they are in the correct format
		// TODO: remove this print statement once the format has been validated
		console.log(json.requirements)
		fs.writeFileSync(output, JSON.stringify(json));
	});
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

// executes code
audit_to_json(INPUT, OUTPUT);

