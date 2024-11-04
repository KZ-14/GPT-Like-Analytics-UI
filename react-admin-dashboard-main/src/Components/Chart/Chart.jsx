import React, { useState, useEffect,useRef} from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis } from 'recharts';

// import css file
import './chart.scss';
import { token_usage } from '../../Api';
/* The `data` array is used to store the data points for the chart. Each object in the array represents
a data point and has two properties: `name` and `total`. */
// Place your own data here
const temp = [
    {
        name: 'January',
        total: 700,
    },
    {
        name: 'February',
        total: 1250,
    },
    {
        name: 'March',
        total: 1410,
    },
    {
        name: 'April',
        total: 1100,
    },
    {
        name: 'May',
        total: 700,
    },
    {
        name: 'June',
        total: 1000,
    },
    {
        name: 'July',
        total: 1250,
    },
    {
        name: 'August',
        total: 1050,
    },
    {
        name: 'September',
        total: 800,
    },
    {
        name: 'October',
        total: 960,
    },
    {
        name: 'November',
        total: 1150,
    },
    {
        name: 'December',
        total: 1250,
    },
];

function Chart({ height, title }) {

    const [data,setData] = useState([])

    useEffect(() => {
        const fetchData = async () => {
            const temp_data = await token_usage();
            console.log(temp_data)
            const formattedData = temp_data.map(item => ({
                Time: new Date(item.Time).toLocaleString(), // Format Time as needed
                Total_tokens: item.Total_tokens,
            }));
            setData(formattedData);
            console.log('Formatted Data:', formattedData); // Log the formatted data
        };
        
        fetchData();
    }, []);
    

    return (

        <div className="chart_sec">
            <div>
                <div className="title">
                    <p>{title} (Last 24 hours)</p>
                </div>

                <div style={{ width: '100%', height: 300 }}>
                    {/* <ResponsiveContainer> */}
                    <AreaChart
                        width={850}
                        height={height}
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="totals" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#536def" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="#536def" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="Time" stroke="gray" />
                        <CartesianGrid strokeDasharray="3 3" className="strokee" />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey="Total_tokens"
                            stroke="#536def"
                            fillOpacity={1}
                            fill="url(#totals)"
                        />
                    </AreaChart>
                    {/* </ResponsiveContainer> */}
                </div>
            </div>
        </div>
    );
}

export default Chart;
