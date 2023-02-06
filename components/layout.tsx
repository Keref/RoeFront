// components/layout.js
import Head from "next/head";
import Link from "next/link";
import { Layout, Menu, theme } from 'antd';
import NavRight from './navRight';
import NavMenu from './navMenu';
const { useToken } = theme;

const MyLayout = ({ children }) =>  {
  const { token } = useToken();
  
  return (
    <Layout style={{ display: 'flex', alignItems: 'center', minHeight: '100vh'}}>
    {/*<Header>
        <title>Roe.Finance</title>
        <link rel="icon" href="/favicon.ico" />
    </Head>*/}
        <Layout.Header 
          style={{ 
            backgroundColor: token.colorBgBase, borderBottomWidth: 1, borderColor: 'red',
            display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 1500, alignItems: 'center'
          }}>
          <img src="/favicon.ico" width={32} height={32} alt='Roe Favicon' />
          <NavMenu bgColor={ token.colorBgBase } />
          <NavRight />
        </Layout.Header>

        <Layout.Content style={{ margin: '24px 16px 0', padding: '24px', maxWidth: 1200 }}>
          {children}
        </Layout.Content>

          
        <Layout.Footer>
        </Layout.Footer>

    </Layout>
  )
}


export default MyLayout;