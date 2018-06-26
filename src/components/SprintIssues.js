import React, { Component } from 'react'
import PropTypes from 'prop-types'
import BuildsIcon from 'react-icons/lib/fa/bars'
import { TrapApiError, Widget, WidgetHeader, WidgetBody, WidgetLoader } from '@mozaik/ui'
import SprintIssue from './SprintIssue'

export default class BuildHistory extends Component {
    static propTypes = {
        project: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        title: PropTypes.string,
        apiData: PropTypes.shape({
            board: PropTypes.object,
            sprint: PropTypes.array.isRequired,
        }),
        apiError: PropTypes.object,
    }

    static getApiRequest({ boardId }) {
        return {
            id: `jira.sprint.${boardId}`,
            params: { boardId },
        }
    }

    render() {
        const { title, apiData, apiError } = this.props

        let body = <WidgetLoader />
        let subject = null
        if (apiData) {
            const { board, sprint } = apiData

            subject = (
                <a href={board.self} target="_blank">
                    {board.name}
                </a>
            )

            body = (
                <div>
                    {sprint.issues.map(issue =>
                        <SprintIssue key={sprint.id} issue={issue} />
                    )}
                </div>
            )
        }

        return (
            <Widget>
                <WidgetHeader
                    title={title || 'Issues'}
                    subject={title ? null : subject}
                    icon={BuildsIcon}
                />
                <WidgetBody>
                    <TrapApiError error={apiError}>
                        {body}
                    </TrapApiError>
                </WidgetBody>
            </Widget>
        )
    }
}
