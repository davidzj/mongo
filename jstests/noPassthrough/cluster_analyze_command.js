import {checkSBEEnabled} from "jstests/libs/sbe_util.js";

const st = new ShardingTest({
    shards: 2,
    mongos: 1,
    other: {
        shardOptions: {setParameter: {featureFlagCommonQueryFramework: true}},
        mongosOptions: {setParameter: {featureFlagCommonQueryFramework: true}}
    }
});

const db = st.getDB("test");

if (!checkSBEEnabled(db)) {
    jsTestLog("Skipping test because SBE is not enabled");
    st.stop();
    quit();
}

const coll = db.analyze_coll;
coll.drop();

assert.commandWorked(
    st.s.adminCommand({enableSharding: db.getName(), primaryShard: st.shard1.shardName}));
assert.commandWorked(
    st.s.adminCommand({shardCollection: coll.getFullName(), key: {_id: "hashed"}}));

assert.commandWorked(coll.insert({a: 1, b: 2}));

let res = db.runCommand({analyze: coll.getName()});
assert.commandWorked(res);

res = db.runCommand({analyze: coll.getName(), apiVersion: "1", apiStrict: true});
assert.commandFailedWithCode(res, ErrorCodes.APIStrictError);

res = db.runCommand({analyze: coll.getName(), writeConcern: {w: 1}});
assert.commandWorked(res);

st.stop();
