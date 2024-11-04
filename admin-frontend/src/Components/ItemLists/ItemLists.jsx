import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocalGroceryStoreOutlinedIcon from '@mui/icons-material/LocalGroceryStoreOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
// import React from 'react';
import { Link } from 'react-router-dom';
import './itemlists.scss';
import React, { useState, useEffect,useRef} from 'react';

import { totalusers,total_tokens,total_input_tokens,total_output_tokens } from '../../Api';

function ItemLists({ type }) {
    let data;
    const [users, setUsers] = useState(0);
    const [tokens, setTokens] = useState(0);
    const [inputtokens, setinputTokens] = useState(0);
    const [outputtokens, setoutputTokens] = useState(0);

    useEffect(() => {
        const fetchTokens = async () => {
            const temptokens = await total_tokens();
            setTokens(temptokens);
        };

        fetchTokens();

        const fetchInputTokens = async () => {
            const tempinputtokens = await total_input_tokens();
            setinputTokens(tempinputtokens);
        };

        fetchInputTokens();

        const fetchOutputTokens = async () => {
            const tempoutputtokens = await total_output_tokens();
            setoutputTokens(tempoutputtokens);
        };

        fetchOutputTokens();
        // Set up the interval to fetch the data every 10 seconds (or any desired interval)
        // const interval = setInterval(fetchTokens, 10000);

        // Cleanup interval on component unmount
        // return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            const tempusers = await totalusers();
            setUsers(tempusers);
        };

        // Fetch the initial data
        fetchUsers();

        // Set up the interval to fetch the data every 10 seconds (or any desired interval)
        // const interval = setInterval(fetchUsers, 10000);

        // Cleanup interval on component unmount
        // return () => clearInterval(interval);
    }, []);

    // Dynamicaly change the ui content
    switch (type) {
        case 'user':
            data = {
                title: 'TOTAL USERS',
                isMoney: false,
                count: users,
                icon: (
                    <PermIdentityIcon
                        style={{
                            color: '#FF74B1',
                            backgroundColor: '#FFD6EC',
                        }}
                        className="icon"
                    />
                ),
                link: 'Access Control',
                linkto: '/users',
            };
            break;
        case 'orders':
            data = {
                title: 'TOTAL TOKENS',
                isMoney: false,
                count: tokens,

                icon: (
                    <LocalGroceryStoreOutlinedIcon
                        style={{
                            color: '#AC7088',
                            backgroundColor: '#FFF38C',
                        }}
                        className="icon"
                    />
                ),
                link: 'View all orders',
                linkto: '/orders',
            };
            break;
        case 'products':
            data = {
                title: 'TOTAL INPUT TOKENS',
                isMoney: false,
                count: inputtokens,
                icon: (
                    <AttachMoneyOutlinedIcon
                        style={{
                            color: '#367E18',
                            backgroundColor: '#A7FFE4',
                        }}
                        className="icon"
                    />
                ),
                link: 'See all products',
                linkto: '/products',
            };
            break;
        case 'balance':
            data = {
                title: 'TOTAL OUTPUT TOKENS',
                count: outputtokens,
                isMoney: false,
                icon: (
                    <PaidOutlinedIcon
                        style={{
                            color: '#AC7088',
                            backgroundColor: '#B1B2FF',
                        }}
                        className="icon"
                    />
                ),
                link: 'See all details',
                linkto: '/',
            };
            break;
        default:
            break;
    }

    return (
        <div className="item_listss">
            <div className="name">
                <p>{data.title}</p>
                <span className="persentage positive">
                    <KeyboardArrowUpIcon />
                    20 %
                </span>
            </div>

            <div className="counts">
                {data.isMoney && <AttachMoneyOutlinedIcon />}
                {data.count}
            </div>

            <div className="see_item">
                <Link to={data.linkto}>
                    <p>{data.link}</p>
                </Link>
                {data.icon}
            </div>
        </div>
    );
}

export default ItemLists;
