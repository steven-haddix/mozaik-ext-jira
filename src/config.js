const convict = require('convict')

const config = convict({
    jira: {
        baseUrl: {
            doc: 'The jira API base url.',
            default: 'https://wentrack.atlassian.net/rest/agile/1.0',
            format: String,
            env: 'JIRA_BASE_URL',
        },
        token: {
            doc: 'The jira API token.',
            default: null,
            format: String,
            env: 'JIRA_API_TOKEN',
        },
    },
})

module.exports = config
