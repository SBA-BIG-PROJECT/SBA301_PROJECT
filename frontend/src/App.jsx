import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Detail from './pages/Detail.jsx'
import Genre from './pages/Genre.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import Register from './pages/Register.jsx'
import SearchPage from './pages/Search.jsx'
import Watch from './pages/Watch.jsx'
import Watchlist from './pages/Watchlist.jsx'
import History from './pages/History.jsx'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="genre/:id" element={<Genre />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="movie/:id" element={<Detail />} />
          <Route path="watch/:id" element={<Watch />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="history" element={<History />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App