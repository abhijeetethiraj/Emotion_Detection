import React from 'react'
import { assets } from '../src/assets/assets'

const Footer = () => {
  return (
    <div>
        <div className='flex items-center justify-between gap-4 py-3 mt-20 mb-2'>
      <img src={assets.logo_icon} alt="" />
      <p className='flex-1 border-l border-gray-200 pl-4 text-sm text-gray-500 max-sm:hidden'>Copyright @AbhijeetEthiraj.dev | All right reserved.</p>
      <div className='flex gap-2.5'>
        <img src={assets.facebook_icon} alt="" width={35} />
         <img src={assets.twitter_icon} alt="" width={35} />
          <img src={assets.instagram_icon} alt="" width={35} />
      </div>
    </div>
    </div>
  )
}

export default Footer
