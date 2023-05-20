import Latestblog from './Latestblog'
import './latestblog.scss'

import { database } from '../../firebase'
import { onValue, ref } from 'firebase/database'
import { useEffect, useState } from 'react'

const Latest = () => {

    const [arr, setArr] = useState([])

    useEffect(() => {
        let ans = []
        onValue(ref(database, 'blogs/'), (snapshot) => 
        {
            let now = []

            if (snapshot) {
                const all = snapshot.val()
                const blogs = Object.values(all)
                now = blogs
            }

            let n = now.length
            if(now > 5)
                now = now.slice(n - 5, n)

            now.reverse()
            ans = now
            setArr(ans)

        })
    }, [])

    return (
        <>
            {/* Latest Blogs Section */}
            <section className="latest_blogs">

                <div className="heading">
                    <p>LATEST BLOGS</p>
                </div>

                <div className="blogs_container">

                {arr.map((each) => (
                    <Latestblog value={each} />
                ))}

                </div>

            </section>
        </>
    )
}

export default Latest