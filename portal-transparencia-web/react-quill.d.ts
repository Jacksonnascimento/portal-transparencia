declare module 'react-quill' {
  import * as React from 'react';

  export interface ReactQuillProps {
    theme?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (content: string, delta: any, source: string, editor: any) => void;
    modules?: any;
    formats?: string[];
    bounds?: string | HTMLElement;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
  }

  export default class ReactQuill extends React.Component<ReactQuillProps> {}
}