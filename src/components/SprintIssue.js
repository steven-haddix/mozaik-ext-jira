import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import ClockIcon from 'react-icons/lib/fa/clock-o'
import { WidgetListItem, WidgetLabel, WidgetStatusChip } from '@mozaik/ui'

export default class BuildHistoryItem extends Component {
    static propTypes = {
        issue: PropTypes.shape({
            id: PropTypes.number.isRequired,
            key: PropTypes.string.isRequired,
            finished_at: PropTypes.string,
            self: PropTypes.string,
            fields: PropTypes.shape({
                status: PropTypes.shape({
                    message: PropTypes.string.isRequired,
                }),
            }),
        }).isRequired,
    }

    render() {
        const { issue } = this.props

        return (
            <div>
                <WidgetListItem
                    title={
                        <span>
                            <a
                                href={`${issue.self}`}
                                target="_blank"
                                style={{ textDecoration: 'underline' }}
                            >
                                #{issue.key}
                            </a>&nbsp;
                            <WidgetLabel label={issue.fields.status.name} prefix="status" />&nbsp;
                        </span>
                    }
                />
            </div>
        )
    }
}
