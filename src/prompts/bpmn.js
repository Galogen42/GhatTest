module.exports = [
  {
    text: 'Start to end',
    xml: `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <process id="example1" isExecutable="false">
    <startEvent id="start" />
    <endEvent id="end" />
    <sequenceFlow id="flow1" sourceRef="start" targetRef="end" />
  </process>
</definitions>`
  },
  {
    text: 'Task between start and end',
    xml: `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <process id="example2" isExecutable="false">
    <startEvent id="start" />
    <task id="task" name="Do work" />
    <endEvent id="end" />
    <sequenceFlow id="f1" sourceRef="start" targetRef="task" />
    <sequenceFlow id="f2" sourceRef="task" targetRef="end" />
  </process>
</definitions>`
  },
  {
    text: 'Gateway with two tasks',
    xml: `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <process id="example3" isExecutable="false">
    <startEvent id="start" />
    <exclusiveGateway id="gate" />
    <task id="task1" name="Option A" />
    <task id="task2" name="Option B" />
    <endEvent id="end" />
    <sequenceFlow id="f1" sourceRef="start" targetRef="gate" />
    <sequenceFlow id="f2" sourceRef="gate" targetRef="task1" />
    <sequenceFlow id="f3" sourceRef="gate" targetRef="task2" />
    <sequenceFlow id="f4" sourceRef="task1" targetRef="end" />
    <sequenceFlow id="f5" sourceRef="task2" targetRef="end" />
  </process>
</definitions>`
  }
];
