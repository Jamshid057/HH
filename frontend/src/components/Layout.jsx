import { Outlet } from 'react-router-dom'
import { SiteFooter, SiteHeader } from './figma'

export function Layout() {
  return (<><SiteHeader /><Outlet /><SiteFooter /></>)
}
