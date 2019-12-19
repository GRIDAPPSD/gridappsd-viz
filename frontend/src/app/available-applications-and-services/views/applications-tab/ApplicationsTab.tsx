import * as React from 'react';

import { Application } from '@shared/Application';
import { NotificationBanner } from '@shared/notification-banner';

import './ApplicationsTab.light.scss';
import './ApplicationsTab.dark.scss';

interface Props {
  applications: Application[];
}

export function ApplicationsTab(props: Props) {
  if (!props.applications || props.applications.length === 0)
    return (
      <NotificationBanner persistent>
        No data available
      </NotificationBanner>
    );
  return (
    <div className='applications-tab-container'>
      <div className='applications-tab'>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Creator</th>
              <th>Inputs</th>
              <th>Outputs</th>
              <th>Options</th>
              <th>Execution Path</th>
              <th>Type</th>
              <th>Launch on Startup</th>
              <th>Prereqs</th>
              <th>Multiple Instances</th>
            </tr>
          </thead>
          <tbody>
            {
              props.applications.map(application => (
                <tr key={application.id}>
                  <td>
                    <div>
                      {application.id}
                    </div>
                  </td>
                  <td>
                    <div>
                      {application.description}
                    </div>
                  </td>
                  <td>
                    <div>
                      {application.creator}
                    </div>
                  </td>
                  <td>
                    {
                      application.inputs.map((input, index) => (
                        <div key={index}>
                          {JSON.stringify(input, null, 4)}
                        </div>
                      ))
                    }
                  </td>
                  <td>
                    {
                      application.outputs.map((output, index) => (
                        <div key={index}>
                          {JSON.stringify(output, null, 4)}
                        </div>
                      ))
                    }
                  </td>
                  <td>
                    {
                      application.options.map((option, index) => (
                        <div key={index}>
                          {option}
                        </div>
                      ))
                    }
                  </td>
                  <td>
                    <div>
                      {application.execution_path}
                    </div>
                  </td>
                  <td>
                    <div>
                      {application.type}
                    </div>
                  </td>
                  <td>
                    <div>
                    </div>
                    {String(application.launch_on_startup)}
                  </td>
                  <td>
                    {
                      application.prereqs.map((prereq, index) => (
                        <div key={index}>
                          {JSON.stringify(prereq, null, 4)}
                        </div>
                      ))
                    }
                  </td>
                  <td>
                    <div>
                      {String(application.multiple_instances)}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
