import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import CreateRoom from './pages/teacher/CreateRoom'
import TeacherRoom from './pages/teacher/TeacherRoom'
import JoinRoom from './pages/student/JoinRoom'
import StudentRoom from './pages/student/StudentRoom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host" element={<CreateRoom />} />
        <Route path="/host/:code" element={<TeacherRoom />} />
        <Route path="/play" element={<JoinRoom />} />
        <Route path="/play/:code/:teamId" element={<StudentRoom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
