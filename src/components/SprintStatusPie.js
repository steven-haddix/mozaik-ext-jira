import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PieIcon from 'react-icons/lib/fa/pie-chart'
import { TrapApiError, Widget, WidgetHeader, WidgetBody, WidgetLoader } from '@mozaik/ui'
import { ResponsivePie } from '@nivo/pie'

export default class SprintStatusPie extends Component {
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

            const statuses = sprint.issues.reduce((acc, curr) => {
                acc[curr.fields.status.name] = (acc[curr.fields.status.name] || 0) + 1
                return acc;
            }, {})

            const colorIndex = [
                "hsl(37, 70%, 50%)",
                "hsl(73, 70%, 50%)",
                "hsl(272, 70%, 50%)",
                "hsl(162, 70%, 50%)",
                "hsl(258, 70%, 50%)"
            ]

            const data = Object.keys(statuses).map((key, idx) => ({
                id: key,
                label: key,
                value: statuses[key],
                color: colorIndex[idx],
            }))

            body = (
                    <ResponsivePie
                        margin={{
                            top: 20,
                            right: 10,
                            bottom: 20,
                            left: 10
                        }}
                        data={data}
                        animate={true}
                        innerRadius={0.6}
                        padAngle={0.5}
                        cornerRadius={5}
                        radialLabelsLinkColor="inherit"
                        radialLabelsLinkStrokeWidth={3}
                        radialLabelsTextColor="#FFF"
                        enableSlicesLabels={true}
                        theme={{
                            "tooltip": {
                                "container": {
                                    "fontSize": "13px"
                                }
                            },
                            "axis": {
                                "fontSize": "15px",
                            }
                        }}
                    />
            )
        }

        return (
            <Widget>
                <WidgetHeader
                    title={title || 'Issues'}
                    subject={title ? null : subject}
                    icon={PieIcon}
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
