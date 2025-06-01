import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// TypeScript declaration for the custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'activities-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'prev-text'?: string;
        'next-text'?: string;
        'counter-format'?: string;
        'hide-counter'?: boolean;
        'hide-nav'?: boolean;
        'compact'?: boolean;
      };
    }
  }
}

export function ActivitiesWidget() {
  return (
    <BrowserOnly>
      {() => {
        // Import the custom element only in the browser environment
        require('../../../../src/activities-widget');
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Default Widget */}
            <div>
              <h4>Default Widget</h4>
              <activities-widget>
                <div className="activity">
                  <div className="img">
                    <img src="https://images.unsplash.com/photo-1723274565296-2945e2ebc306?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MzI0NzE1OTF8&ixlib=rb-4.0.3&q=80&w=400" alt="Ice Catch Activity" />
                  </div>
                  <div className="text">
                    <h3>Ice Catch</h3>
                    <p>It's like regular catch, but it's on ice so it's cooler literally.</p>
                  </div>
                </div>

                <div className="activity">
                  <div className="img">
                    <img src="https://images.unsplash.com/photo-1607930232028-f01079639b00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MzI0NzIxMjV8&ixlib=rb-4.0.3&q=80&w=400" alt="Mud Touching Activity" />
                  </div>
                  <div className="text">
                    <h3>Mud Touching</h3>
                    <p>Mud isn't going to touch itself.</p>
                  </div>
                </div>

                <div className="activity">
                  <div className="img">
                    <img src="https://images.unsplash.com/photo-1677757103853-a304b6a182f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MzI1NjgyODB8&ixlib=rb-4.0.3&q=80&w=400" alt="BMX Football Activity" />
                  </div>
                  <div className="text">
                    <h3>BMX Football</h3>
                    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repellendus enim hic quo amet?</p>
                  </div>
                </div>

                <div className="activity">
                  <div className="img">
                    <img src="https://images.unsplash.com/photo-1676312830459-f6f13dfdd899?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MzI3MjQ5Nzh8&ixlib=rb-4.0.3&q=80&w=400" alt="Shoe Tying Activity" />
                  </div>
                  <div className="text">
                    <h3>Shoe Tying</h3>
                    <p>I love tying shoes. Bunny style. The other bunny style. All the styles.</p>
                  </div>
                </div>
              </activities-widget>
            </div>

            {/* Customized Widget */}
            <div>
              <h4>Customized Widget (Compact with Custom Text)</h4>
              <activities-widget 
                compact={true}
                prev-text="Previous" 
                next-text="Next"
                counter-format="Step {current} of {total}">
                <div className="activity">
                  <div className="img">
                    <img src="https://images.unsplash.com/photo-1516796181074-bf453fbfa3e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MzI0NzE1OTF8&ixlib=rb-4.0.3&q=80&w=400" alt="Guitar Activity" />
                  </div>
                  <div className="text">
                    <h3>Guitar Playing</h3>
                    <p>Making music one chord at a time.</p>
                  </div>
                </div>

                <div className="activity">
                  <div className="img">
                    <img src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MzI0NzIxMjV8&ixlib=rb-4.0.3&q=80&w=400" alt="Cooking Activity" />
                  </div>
                  <div className="text">
                    <h3>Cooking</h3>
                    <p>Creating delicious meals from scratch.</p>
                  </div>
                </div>

                <div className="activity">
                  <div className="img">
                    <img src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MzI1NjgyODB8&ixlib=rb-4.0.3&q=80&w=400" alt="Reading Activity" />
                  </div>
                  <div className="text">
                    <h3>Reading</h3>
                    <p>Exploring new worlds through books.</p>
                  </div>
                </div>
              </activities-widget>
            </div>
          </div>
        );
      }}
    </BrowserOnly>
  );
} 