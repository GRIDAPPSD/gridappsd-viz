import { Service, ServiceConfigUserInputSpec } from '@client:common/Service';
import { MessageBanner } from '@client:common/overlay/message-banner';

import './ServicesTab.light.scss';
import './ServicesTab.dark.scss';

interface Props {
  services: Service[];
}

/**
 * Functional component for the "Services" tab which is shown
 * when the menu item "Applications & Services" is selected.
 *
 * @param props
 */
export function ServicesTab(props: Props) {
  if (!props.services || props.services.length === 0) {
    return (
      <MessageBanner>
        No data available
      </MessageBanner>
    );
  }
  return (
    <div className='services-tab-container'>
      <div className='services-tab'>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Creator</th>
              <th>Input Topics</th>
              <th>Output Topics</th>
              <th>Static Arguments</th>
              <th>Execution Path</th>
              <th>User Input</th>
              <th>Type</th>
              <th>Launch on Startup</th>
              <th>Service Dependencies</th>
              <th>Multiple Instances</th>
              <th>Environment Variables</th>
            </tr>
          </thead>
          <tbody>
            {
              props.services.map(service => (
                <tr key={service.id}>
                  <td>
                    <div>
                      {service.id}
                    </div>
                  </td>
                  <td>
                    <div>
                      {service.description}
                    </div>
                  </td>
                  <td>
                    <div>
                      {service.creator}
                    </div>
                  </td>
                  <td>
                    {
                      service.input_topics
                      &&
                      (
                        service.input_topics.map((inputTopic, index) => (
                          <div key={index}>
                            {inputTopic}
                          </div>
                        ))
                      )
                    }
                  </td>
                  <td>
                    {
                      service.output_topics
                      &&
                      (
                        service.output_topics.map((outputTopic, index) => (
                          <div key={index}>
                            {outputTopic}
                          </div>
                        ))
                      )
                    }
                  </td>
                  <td>
                    {
                      service.static_args.map((arg, index) => (
                        <div key={index}>
                          {arg}
                        </div>
                      ))
                    }
                  </td>
                  <td>
                    <div>
                      {service.execution_path}
                    </div>
                  </td>
                  <td>
                    {
                      service.user_input
                      &&
                      (
                        <table>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Type</th>
                              <th>Default Value</th>
                              <th>Min Value</th>
                              <th>Max Value</th>
                              <th>Help</th>
                              <th>Example Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {
                              Object.entries(service.user_input)
                                .map(([inputName, inputSpec]) => (
                                  <tr key={inputName}>
                                    <td>
                                      <div>
                                        {inputName}
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        {inputSpec.type}
                                      </div>
                                    </td>
                                    <td>
                                      {formatValue(inputSpec.default_value, inputSpec.type)}
                                    </td>
                                    <td>
                                      <div>
                                        {inputSpec.min_value}
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        {inputSpec.max_value}
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        {inputSpec.help}
                                      </div>
                                    </td>
                                    <td>
                                      {formatValue(inputSpec.help_example, inputSpec.type)}
                                    </td>
                                  </tr>
                                ))
                            }
                          </tbody>
                        </table>
                      )
                    }
                  </td>
                  <td>
                    <div>
                      {service.type}
                    </div>
                  </td>
                  <td>
                    <div>
                      {String(service.launch_on_startup)}
                    </div>
                  </td>
                  <td>
                    {
                      service.service_dependencies
                      &&
                      (
                        service.service_dependencies.map((dep, index) => (
                          <div key={index}>
                            {dep}
                          </div>
                        ))
                      )
                    }
                  </td>
                  <td>
                    <div>
                      {String(service.multiple_instances)}
                    </div>
                  </td>
                  <td>
                    {
                      service.environmentVariables.map((environmentVariable, index) => (
                        <div key={index}>
                          <span>
                            {environmentVariable.envName}
                          </span>
                          <span>=</span>
                          <span>
                            {environmentVariable.envValue}
                          </span>
                        </div>
                      ))
                    }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatValue(value: any, type: ServiceConfigUserInputSpec['type']) {
  if (type === 'object') {
    const formattedValue = JSON.stringify(value, null, 4);
    if (formattedValue === '{}') {
      return (
        <div>
          {formattedValue}
        </div>
      );
    }
    return (
      <div style={{ textAlign: 'left' }}>
        {formattedValue}
      </div>
    );
  }
  return (
    <div>
      {String(value)}
    </div>
  );
}
