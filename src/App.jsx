import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Detail from './pages/Detail.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import Register from './pages/Register.jsx'
import SearchPage from './pages/Search.jsx'
import Watch from './pages/Watch.jsx'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="movie/:id" element={<Detail />} />
          <Route path="watch/:id" element={<Watch />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App