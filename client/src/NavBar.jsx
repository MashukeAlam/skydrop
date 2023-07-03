import {MdNightlightRound} from 'react-icons/md';
import {FiSun} from 'react-icons/fi';
import {RxGithubLogo} from 'react-icons/rx'
import { useEffect, useState } from 'react';

const NavBar = () => {
    const [theme, setTheme] = useState('light');
    useEffect(() => {
        if (localStorage.getItem('theme') && localStorage.getItem('theme') == 'dark') {
            setTheme('dark');
        }
    }, [])
    useEffect(() => {
        if (theme == 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme])
    return (
        <div className="nav flex flex-row justify-end dark:bg-slate-800 pr-5">
            {theme != 'dark' ? <MdNightlightRound className='h-10 w-10 dark:text-white m-2' onClick={() => setTheme('dark')} /> : <FiSun className='h-10 w-10 dark:text-white m-2' onClick={() => setTheme('light')} />}
            <RxGithubLogo className='h-10 w-10 dark:text-white m-2' />
        </div>
    )
}

export default NavBar;