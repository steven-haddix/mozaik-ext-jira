'use strict'

const request = require('request-promise-native')
const chalk = require('chalk')
const config = require('./config')

/**
 * @param {Mozaik} mozaik
 */
const client = mozaik => {
    mozaik.loadApiConfig(config)

    const buildApiRequest = (path, params) => {
        const url = (params && params.baseUrl) ? params.baseUrl : config.get('jira.baseUrl');

        const options = {
            uri: `${url}${path}`,
            qs: {},
            json: true,
            resolveWithFullResponse: true,
            headers: {
                'Authorization': `Basic ${config.get('jira.token')}`,
            },
        }

        const paramsDebug = params ? ` ${JSON.stringify(params)}` : ''
        mozaik.logger.info(chalk.yellow(`[jira] calling ${url}${path}${paramsDebug}`))

        if (params) {
            options.qs = params
        }

        return request(options)
    }

    const operations = {
        board({ boardId }) {
            return buildApiRequest(`/board/${encodeURIComponent(boardId)}`)
                .then(res => res.body)
        },
        issues({ sprintId }) {
             return buildApiRequest(`/sprint/${encodeURIComponent(sprintId)}/issue?fields=status,issueType,assignee`)
                 .then(res => res.body.issues)
        },
        sprint({ boardId }) {
            return Promise.all([
                operations.board({ boardId }),
                buildApiRequest(`/board/${encodeURIComponent(boardId)}/sprint?state=active`)
                    .then(res => res.body.values[0])
                    .then(sprint => {
                        return operations.issues({ sprintId: sprint.id })
                            .then((issues) => {
                                return {
                                    ...sprint,
                                    issues,
                                }
                            })
                    })
            ]).then(([board, sprint]) => ({
                board,
                sprint,
            }))
        },
        burnDown({ boardId }) {
            return buildApiRequest(`/board/${encodeURIComponent(boardId)}/sprint?state=active`)
                .then(res => res.body.values[0])
                .then(({ id }) => {
                    return buildApiRequest(`/rapid/charts/scopechangeburndownchart.json?rapidViewId=${boardId}&sprintId=${id}`,
                        { baseUrl: 'https://wentrack.atlassian.net/rest/greenhopper/1.0'} )
                        .then(res => ({ burnDown: res.body }))
                })

        }
    }

    return operations
}

module.exports = client
