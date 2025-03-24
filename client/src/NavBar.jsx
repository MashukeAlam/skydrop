import {MdNightlightRound} from 'react-icons/md';
import {FiSun} from 'react-icons/fi';
import {RxGithubLogo} from 'react-icons/rx'
import { useEffect, useState } from 'react';

const NavBar = () => {
    const [theme, setTheme] = useState('dark');

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
        </div>
    )
}

export default NavBar;