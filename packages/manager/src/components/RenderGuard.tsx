import { WithTheme, withTheme } from '@mui/styles';
import { equals } from 'ramda';
import * as React from 'react';

import { getDisplayName } from 'src/utilities/getDisplayName';

export interface RenderGuardProps {
  updateFor?: any[];
}

/* tslint:disable-next-line */
export const RenderGuard = <P extends {}>(
  Component: React.ComponentType<P & RenderGuardProps>
) => {
  class ComponentWithRenderGuard extends React.Component<
    RenderGuardProps & WithTheme
  > {
    render() {
      // cast of this.props to any needed because of
      // https://github.com/Microsoft/TypeScript/issues/17281
      //
      // Destructure out "theme" so it's not passed to the component.
      // This fixes the "<div theme=[object Object] />" issue.
      const { theme, updateFor, ...rest } = this.props as any;
      return <Component {...rest} />;
    }

    shouldComponentUpdate(nextProps: P & RenderGuardProps & WithTheme) {
      if (Array.isArray(this.props.updateFor)) {
        // don't update if the values of the updateFor Array are equal
        // this is a deep comparison
        return (
          !equals(this.props.updateFor, nextProps.updateFor) ||
          this.props.theme.name !== nextProps.theme.name ||
          this.props.theme.spacing(1) !== nextProps.theme.spacing(1)
        );
      }
      // if updateFor isn't provided, always update (this is React's default behavior)
      return true;
    }

    static displayName = `WithRenderGuard(${getDisplayName(Component)})`;
  }

  return withTheme(ComponentWithRenderGuard) as React.ComponentType<
    P & RenderGuardProps
  >;
};
