export const SIMULATION_CONFIG_OPTIONS = {
  "power_system_config": {
    "GeographicalRegion_names": ["ieee8500nodecktassets_Region"],
    "SubGeographicalRegion_names": ["ieee8500nodecktassets_SubRegion"],
    "Line_names": ["ieee8500"]
  },
  "simulation_config": {
    "start_time": "2009-07-21 00:00:00",
    "duration": "120",
    "simulators": ["GridLAB-D"],
    "timestep_frequency": "1000",
    "timestep_increment": "1000",
    "run_realtime": true,
    "simulation_name": "ieee8500",
    "power_flow_solver_method": "NR",
    "model_creation_config": {
      "load_scaling_factor": "1",
      "schedule_name": "ieeezipload",
      "z_fraction": "0",
      "i_fraction": "1",
      "p_fraction": "0",
      "randomize_zipload_fractions": false,
      "use_houses": false
    }
  },
  "application_config": {
    "applications": [
      // {
      //   "name": "vvo", "config_string": "{\"static_inputs\": {\"ieee8500\" : {\"control_method\": \"ACTIVE\", \"capacitor_delay\": 60, \"regulator_delay\": 60, \"desired_pf\": 0.99, \"d_max\": 0.9, \"d_min\": 0.1,\"substation_link\": \"xf_hvmv_sub\",\"regulator_list\": [\"reg_FEEDER_REG\", \"reg_VREG2\", \"reg_VREG3\", \"reg_VREG4\"],\"regulator_configuration_list\": [\"rcon_FEEDER_REG\", \"rcon_VREG2\", \"rcon_VREG3\", \"rcon_VREG4\"],\"capacitor_list\": [\"cap_capbank0a\",\"cap_capbank0b\", \"cap_capbank0c\", \"cap_capbank1a\", \"cap_capbank1b\", \"cap_capbank1c\", \"cap_capbank2a\", \"cap_capbank2b\", \"cap_capbank2c\", \"cap_capbank3\"], \"voltage_measurements\": [\"l2955047,1\", \"l3160107,1\", \"l2673313,2\", \"l2876814,2\", \"m1047574,3\", \"l3254238,4\"],       \"maximum_voltages\": 7500, \"minimum_voltages\": 6500,\"max_vdrop\": 5200,\"high_load_deadband\": 100,\"desired_voltages\": 7000,   \"low_load_deadband\": 100,\"pf_phase\": \"ABC\"}}}"
      // },
      //{
      //  'name': 'sample_app',
      //  'config_string': ''
      // }
    ]
  }
};