import { useState } from 'react'
import Login from './Login'
import Signup from './Signup'
import '../../styles/signup.scss'



const Registration = () => {

  const [login, setLogin] = useState(false)

  const log = () => {
    setLogin(true);
  }

  const sign = () => {
    setLogin(false)
  }

  return (
    <>
        <section className="wrapper">

          <div className="signup-login-buttons">
            <button className='btn' onClick={log}>LOGIN</button>
            <button className='btn' onClick={sign}>SIGNUP</button>
          </div>

          <div className="signup-login">
            {login && <Login />}
            {!login && <Signup className='signup' />}
          </div>

        </section>
    </>
  )
}

export default Registration