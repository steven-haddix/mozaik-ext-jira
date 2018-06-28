const moment = require('moment');

const actionTypes = {
    UPDATE_ESTIMATE: 'UPDATE_ESTIMATE',
    ADD: 'ADD',
    REMOVE: 'REMOVE',
    COMPLETE: 'COMPLETE'
}

const determineActionType = (change) => {
    if (change.statC && change.statC.newValue) {
        return {
            type: actionTypes.UPDATE_ESTIMATE,
            value: change.statC.newValue
        }
    }

    if (change.added === true || change.added === false) {
        return {
            type: change.added ? actionTypes.ADD : actionTypes.REMOVE
        }
    }

    if (change.column && change.column.newStatus && change.column.done === true) {
        return {
            type: actionTypes.COMPLETE
        }
    }
}

const aggregateChanges = (burdownData) => {
    const sprintStart = burdownData.startTime / 1000;
    const sprintEnd = burdownData.endTime / 1000;

    const rawChanges = burdownData.changes;
    const changeAggregates = {};

    Object.keys(rawChanges).forEach((key, index) => {
        const change = rawChanges[key][0];
        const changeDate = moment.unix(key / 1000).startOf('day').format();

        /*if (moment.unix(key / 1000).startOf('day').isBefore(moment.unix(sprintStart).startOf('day')) ||
            moment.unix(key / 1000).startOf('day').isAfter(moment.unix(sprintEnd).endOf('day'))) {
            console.log('NOT BETWEEN SPRINT DATES', changeDate);
            return;
        }*/

        if (!Array.isArray(changeAggregates[changeDate])) {
            changeAggregates[changeDate] = [];
        }

        changeAggregates[changeDate].push({
            id: change.key,
            action: determineActionType(change),
        })
    });

    return changeAggregates;
}

/**
 * Generate a map with all with each day of the sprint within it
 * @param burnDownData
 * @param sprintMap
 */
const createSprintDays = (burnDownData, sprintMap) => {
    const startOfSprint = sprintMap.firstDay;
    const endOfSprint = sprintMap.lastDay;

    let day = startOfSprint;

    while (day <= endOfSprint) {
        sprintMap.days[moment(day).startOf('day').format()] = {
            remainingPoints: 0,
            remainingStories: 0
        };
        day = moment(day).clone().add(1, 'd');
    }
    console.log(day <= endOfSprint)

};

const issueStatus = {
    IN_BACKLOG: 'IN BACKLOG',
    IN_SPRINT: 'IN SPRINT',
    COMPLETED: 'COMPLETED'
}

const createIssues = (burnDownData, sprintMap) => {
    Object.keys(burnDownData.issueToSummary).forEach((key, index) => {
        const issue = burnDownData.issueToSummary[key];
        sprintMap.issues[key] = {
            title: issue,
            status: issueStatus.IN_BACKLOG,
            points: 0,
        }
    })
}

const createSprintMap = (burnDownData) => {
    const sprintMap = {
        totalPoints: 0,
        remainingPoints: 0,
        totalStories: 0,
        remainingStories: 0,
        firstDay: moment.unix(burnDownData.startTime / 1000).startOf('day'),
        lastDay: moment.unix(burnDownData.endTime / 1000).startOf('day'),
        days: {},
        issues: {}
    };

    createSprintDays(burnDownData, sprintMap);
    createIssues(burnDownData, sprintMap);

    return sprintMap;
}


const replaySprintChanges = (sprintMap, changes) => {
    // Loop event days
    Object.keys(changes).forEach((day, index) => {
        let sprintDay = {};

        const eventDay = moment(day);

        if (eventDay.isBefore(sprintMap.firstDay)) {
            sprintDay = sprintMap.days[sprintMap.firstDay.format()]
        }

        if (eventDay.isAfter(moment(sprintMap.lastDay))) {
            sprintDay = sprintMap.days[sprintMap.lastDay.format()]
        }

        if (eventDay.isSameOrAfter(moment(sprintMap.firstDay)) && eventDay.isSameOrBefore(sprintMap.lastDay)) {
            sprintDay = sprintMap.days[day]
        }

        Object.keys(changes[day]).forEach((eventKey, index) => {
            const event = changes[day][eventKey];

            if (!event.action) {
                return;
            }

            // ADD ISSUE TO CURRENT SPRINT
            if (event.action.type === actionTypes.ADD) {
                sprintMap.totalStories = sprintMap.totalStories + 1;
                sprintMap.remainingStories = sprintMap.remainingStories + 1;

                const issue = sprintMap.issues[event.id];

                if (issue) {
                    issue.status = issueStatus.IN_SPRINT
                }
            }

            // REMOVE ISSUE FROM SPRINT
            if (event.action.type === actionTypes.REMOVE) {
                sprintMap.totalStories = sprintMap.totalStories - 1;
                sprintMap.remainingStories = sprintMap.remainingStories - 1;

                const issue = sprintMap.issues[event.id];

                if (issue) {
                    issue.status = issueStatus.IN_BACKLOG
                }
            }

            // COMPLETE ISSUE
            if (event.action.type === actionTypes.COMPLETE) {
                sprintMap.remainingStories = sprintMap.remainingStories - 1;

                const issue = sprintMap.issues[event.id];

                if (issue) {
                    issue.status = issueStatus.COMPLETED
                    sprintMap.remainingPoints = sprintMap.remainingPoints - issue.points;
                }
            }

            // UPDATE ISSUE ESTIMATE
            if (event.action.type === actionTypes.UPDATE_ESTIMATE) {
                const issue = sprintMap.issues[event.id];

                if (issue) {
                    const pointDiff = event.action.value - issue.points;
                    issue.points = event.action.value;

                    sprintMap.remainingPoints = sprintMap.remainingPoints + pointDiff;
                } else {
                    sprintMap.issues[event.id] = {
                        title: '',
                        points: event.action.value
                    }
                }
            }
        })

        //sprintDay.totalStories = sprintMap.totalStories;
        sprintDay.remainingPoints = sprintMap.remainingPoints;
        sprintDay.remainingStories = sprintMap.remainingStories;
    })

    // Fill in the totals for days that don't have events
    let lastDay = null;
    const numberOfSprintDays = Object.keys(sprintMap.days).length;

    Object.keys(sprintMap.days).forEach((day, index) => {
        const currentDay = sprintMap.days[day];

        if (!moment(day).isSameOrBefore(moment())) {
            return;
        }

        if (currentDay.remainingStories === 0 && lastDay && (index + 1) !== numberOfSprintDays) {
            currentDay.remainingStories = lastDay.remainingStories;
        }

        if (currentDay.remainingPoints === 0 && lastDay && (index + 1) !== numberOfSprintDays) {
            currentDay.remainingPoints = lastDay.remainingPoints;
        }

        lastDay = currentDay;
    })}


export default function generateBurnDownData(burnDownData) {
    const changes = aggregateChanges(burnDownData);
    const sprintMap = createSprintMap(burnDownData);

    replaySprintChanges(sprintMap, changes)

    return sprintMap;
}
