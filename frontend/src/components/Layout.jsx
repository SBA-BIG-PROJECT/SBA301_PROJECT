import { Outlet } from 'react-router-dom'
import Footer from './Footer.jsx'
import Header from './Header.jsx'

const Layout = () => {
  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <Header />
        <Outlet />
        <Footer />
      </div>
    </main>
  )
}

export default Layout
