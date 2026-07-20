import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('TimeGarden UI error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div className="min-h-screen grid place-items-center bg-slate-50 p-6"><div className="card p-8 max-w-md text-center"><h1 className="text-xl font-semibold">页面暂时无法显示</h1><p className="text-sm text-slate-500 mt-2">你的数据不会丢失，请刷新页面重试。</p><button onClick={() => window.location.reload()} className="mt-5 px-5 py-2 rounded-lg bg-emerald-500 text-white">刷新页面</button></div></div>;
    }
    return this.props.children;
  }
}
