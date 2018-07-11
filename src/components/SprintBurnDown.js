import React, { Component } from 'react'
import PropTypes from 'prop-types'
import LineIcon from 'react-icons/lib/fa/line-chart'
import moment from 'moment'
import { TrapApiError, Widget, WidgetHeader, WidgetBody, WidgetLoader } from '@mozaik/ui'
import { ResponsiveLine } from '@nivo/line'
import generateBurnDownData from './burnDownUtil';

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
            id: `jira.burnDown.${boardId}`,
            params: { boardId },
        }
    }

    render() {
        const { title, apiData, apiError } = this.props

        let body = <WidgetLoader />
        let subject = null
        if (apiData) {
            const { burnDown } = apiData

            const burnDownData = generateBurnDownData(burnDown)
            const formattedData = Object.keys(burnDownData.days).map((key, idx) => {
                return {
                    color: "#F36955",
                    x: idx + 1,
                    y: burnDownData.days[key].remainingPoints !== undefined ? burnDownData.days[key].remainingPoints : null
                }
            })

            let initialValue = null;
            let currentValue = null;
            let rate = null;
            const formattedBaseLineData = Object.keys(burnDownData.days).map((key, idx) => {
                if (currentValue) {
                    currentValue = currentValue - rate;
                }

                if (!initialValue) {
                    initialValue = burnDownData.days[key].remainingPoints
                    currentValue = initialValue;
                    rate = initialValue / (Object.keys(burnDownData.days).length - 1)
                }

                return {
                    color: "#F36955",
                    x: idx + 1,
                    y: currentValue
                };
            });

            const burnDownChart = [
                {
                    id: "Base Line",
                    color: "#F36955",
                    data: formattedBaseLineData
                },
                {
                    id: "Never Frozen",
                    color: "#F36955",
                    data: formattedData
                }
            ]

            body = (
                <ResponsiveLine
                    data={burnDownChart}
                    margin={{
                        "top": 20,
                        "right": 40,
                        "bottom": 50,
                        "left": 60
                    }}
                    minY="0"
                    stacked={false}
                    axisLeft={{
                        "orient": "left",
                        "tickSize": 5,
                        "tickPadding": 5,
                        "tickRotation": 0,
                        "legend": "Remaining Points",
                        "legendOffset": -40,
                        "legendPosition": "center"
                    }}
                    dotSize={10}
                    dotColor="inherit:darker(0.3)"
                    dotBorderWidth={2}
                    dotBorderColor="#002630"
                    enableDotLabel={false}
                    dotLabel="y"
                    dotLabelYOffset={-12}
                    animate={true}
                    motionStiffness={90}
                    motionDamping={15}
                    theme={{
                        axis: {
                            fontSize: "15px",
                            textColor: '#fff',
                            tickColor: '#fff',
                            legendColor: '#fff',
                            legendFontSize: '14px'
                        },
                        dots: {
                            textColor: '#fff',
                        }
                    }}
                />
            )
        }

        return (
            <Widget>
                <WidgetHeader
                    title={title || 'Burn Down'}
                    subject={title ? null : subject}
                    icon={LineIcon}
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
