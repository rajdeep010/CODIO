import { createContext, useState, useContext } from "react"
import moment from "moment";
import uniqid from 'uniqid'
import { onValue, ref, remove, set, update } from 'firebase/database'
import { database } from "../firebase";
import { notifier } from "../utils/notify";


const BlogContext = createContext({
    value: '',
    type: '',
    makeBlog: () => { },
    updateVal: () => { },
    makeComment: () => { },
    addLike: () => { },
    handleBookMark:  () => { },
    addComment: () => { },
    blogWriter: () => { },
})

const BlogProvider = (props) => {

    const [value, setValue] = useState("");

    const updateVal = (val) => {
        setValue(val);
    }

    const blogWriter = (bid) => {
        let uid = ''
        const dbref = ref(database, 'blogs/' + bid)
        onValue(dbref, (snapshot) => {
            if (snapshot)
                uid = snapshot.val().authorid
        })

        const newRef = ref(database, 'users/' + uid + '/details')
        let name = ''
        onValue(newRef, (snapshot) => {
            if (snapshot)
                name = snapshot.val().name
        })

        return name
    }


    const makeComment = (comment, author) => {
        const commentID = uniqid('cmnt-')

        return ({
            'commentID': commentID,
            'comment': comment,
            'time': Date.now(),
            'author': author
        })
    }

    const addComment = (bid, cmntID, setComment, obj) => {
        const commentListRef = ref(database, 'blogs/' + bid + '/comments/' + cmntID)

        // comment pushed
        set(commentListRef, obj)
        .then(() => {
            notifier('Comment added', 'success')
        })
        .catch((err)=>{
            notifier('Something went wrong', 'error')
        })

        // comment count update
        // for that first retrive the previous value
        const dbRef = ref(database, 'blogs/' + bid + '/metrics')

        let cmnts = 0
        onValue(dbRef, (snapshot) => {
            cmnts = snapshot.val().cmnts
        })

        update(dbRef, {
            cmnts: cmnts + 1
        })

        setComment('')
    }

    const addLike = (userId, bid, setIsLiked) => {
        const dbRef = ref(database, 'users/' + userId + '/likedBlogs')

        let res
        onValue(dbRef, (snapshot) => {
            res = snapshot.val()
        })

        if (res === null) {
            const obj = {
                'time': moment().format('DD/MM/YYYY HH:mm:ss')
            }

            const newRef = ref(database, 'users/' + userId + '/likedBlogs/' + bid)
            set(newRef, obj)

            // update the like count
            const likeCountRef = ref(database, 'blogs/' + bid + '/metrics/')

            let likes = 0
            onValue(likeCountRef, (snapshot) => {
                likes = snapshot.val().likes
            })

            update(likeCountRef, {
                likes: likes + 1
            })
            .then(() => {
                setIsLiked(true)
                notifier('Liked', 'success')
            })
            .catch((err) => {
                notifier('Something went wrong', 'error')
            })
        }

        else {
            // check whether, for the current userID already present or not
            // console.log(res)

            let found = false
            for (const key in res) {
                // console.log(key)
                if (key === bid) {
                    found = true
                    break
                }
            }

            // already liked blog  => remove from list
            if (found === true) {
                const newRef = ref(database, 'users/' + userId + '/likedBlogs/' + bid)
                remove(newRef)

                // like count update
                const likeCountRef = ref(database, 'blogs/' + bid + '/metrics/')

                let likes = 0
                onValue(likeCountRef, (snapshot) => {
                    likes = snapshot.val().likes
                })

                if (likes > 0) {
                    update(likeCountRef, {
                        likes: likes - 1
                    })
                    .then(() => {
                        setIsLiked(false)
                        notifier('Like Removed', 'error')
                    })
                    .catch((err) => {
                        notifier('Something went wrong', 'error')
                    })
                }
            }

            // not liked blog => now set as liked
            else {
                const obj = {
                    'time': moment().format('DD/MM/YYYY HH:mm:ss')
                }

                const newRef = ref(database, 'users/' + userId + '/likedBlogs/' + bid)
                set(newRef, obj)

                // update the like count
                const likeCountRef = ref(database, 'blogs/' + bid + '/metrics/')

                let likes = 0
                onValue(likeCountRef, (snapshot) => {
                    likes = snapshot.val().likes
                })

                update(likeCountRef, {
                    likes: likes + 1
                })
                .then(() => {
                    setIsLiked(true)
                    notifier('Liked', 'success')
                })
                .catch((err) => {
                    notifier('Something went wrong', 'error')
                })
            }
        }
    }

    const handleBookMark = (userID, bid, setIsBookmarked) => {
        const dbRef = ref(database, 'users/' + userID + '/bookMarkedBlogs')

        let res
        onValue(dbRef, (snapshot) => {
            res = snapshot.val()
        })

        if (res === null) {
            const obj = {
                'time': Date.now()
            }

            const newRef = ref(database, 'users/' + userID + '/bookMarkedBlogs/' + bid)
            set(newRef, obj)

            setIsBookmarked(true)

            const bookmarkCountRef = ref(database, 'users/' + userID + '/details/')

            let bookmarked = 0
            onValue(bookmarkCountRef, (snapshot) => {
                bookmarked = (snapshot.val().bookmarked === null) ? 0 : snapshot.val().bookmarked
            })

            update(bookmarkCountRef, {
                bookmarked: bookmarked + 1
            })
        }

        else {

            // the current user has some bookmarked blogs
            // now find whether the current blog is bookmarked or not

            let found = false
            for (const key in res) {
                if (key === bid) {
                    found = true
                    break
                }
            }

            // if already bookmarked => then remove from the bookmarked list
            if (found === true) {
                const newRef = ref(database, 'users/' + userID + '/bookMarkedBlogs/' + bid)
                remove(newRef)

                const bookmarkedRef = ref(database, 'users/' + userID + '/details/')

                let bookmarked = 0
                onValue(bookmarkedRef, (snapshot) => {
                    bookmarked = snapshot.val().bookmarked
                })

                if (bookmarked > 0) {
                    update(bookmarkedRef, {
                        bookmarked: bookmarked - 1
                    })

                    setIsBookmarked(false)
                }
            }

            // not already bookmarked => set it as bookmarked
            else {
                const obj = {
                    'time': Date.now()
                }

                const newRef = ref(database, 'users/' + userID + '/bookMarkedBlogs/' + bid)
                set(newRef, obj)

                setIsBookmarked(true)

                // update the current user's bookmarked count
                const bookmarkCountRef = ref(database, 'users/' + userID + '/details/')

                let bookmarked = 0
                onValue(bookmarkCountRef, (snapshot) => {
                    bookmarked = snapshot.val().bookmarked
                })

                update(bookmarkCountRef, {
                    bookmarked: bookmarked + 1
                })
            }
        }
    }


    const makeBlog = (title, val, userId, type, name, image) => {

        let content = val.replace(/<[^>]+>/g, '')

        let readtime = Math.round(content.length / 350)

        // console.log(image)

        if (readtime > 1)
            readtime = readtime + ' mins read'

        else
            readtime = readtime + ' min read'

        const bid = uniqid()

        return ({
            'authorid': userId,
            'bid': bid,
            'authorName': name,
            'blogTitle': title,
            'blogContent': content,
            'blogHTML': val,
            'type': type.toUpperCase(),
            'metrics': {
                'likes': 0,
                'cmnts': 0
            },
            'comments': [],
            'date': Date.now(),
            'readtime': readtime
        })
    }


    const state = {
        value: value,
        updateVal: updateVal,
        makeBlog: makeBlog,
        makeComment: makeComment,
        addLike: addLike,
        handleBookMark: handleBookMark,
        addComment: addComment,
        blogWriter: blogWriter,
    }

    return (
        <BlogContext.Provider value={state}>
            {props.children}
        </BlogContext.Provider>
    )
}

export default BlogProvider;

export { BlogContext }