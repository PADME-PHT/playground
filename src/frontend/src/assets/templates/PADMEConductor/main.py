import padme_conductor as pc
from padme_conductor.Plugins.SQL import SqlPlugin
from padme_conductor.Query import Query
from padme_conductor.Separation import Separation

env = pc.get_environment_vars(
    [
        "ENTER ENVS HERE",
    ]
)

###
##Plugins
###



result = pc.query(
    [      
        #Add Query
        Query(""),
    ],
    env["STATION_NAME"],
)

###Your Analysis Code
def analysis(query_result):
    
    
    
    return res

##Execute Analysis
res = pc.execute_analysis(analysis, result)

##Get Previous Results
prev = pc.retrieve_prev_result("result.txt", separate_by=Separation.STATION)

##Logging
pc.log(prev, extra={"tags": ["cpu_consumption"]})


# Write to file
save_string = env["STATION_NAME"] + ":" + str(res) + "\n"
pc.save(save_string, "result.txt", separate_by=Separation.STATION)