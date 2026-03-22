import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import List "mo:core/List";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";

actor {
  // Type Definitions

  public type Task = {
    id : Nat;
    title : Text;
    taskType : {
      #pushups;
      #situps;
      #custom : Text;
    };
    targetReps : Nat;
    coinReward : Nat;
    repeatOption : {
      #daily;
      #weekly;
      #custom : Nat;
      #never;
    };
    priority : Bool;
    completedAt : ?Time.Time;
    isActive : Bool;
  };

  public type Reward = {
    id : Nat;
    name : Text;
    coinCost : Nat;
  };

  public type Redemption = {
    id : Nat;
    rewardType : {
      #screenTime : Nat;
      #customReward : Nat;
    };
    coinsSpent : Nat;
    timestamp : Time.Time;
  };

  public type UserProfile = {
    coinBalance : Int;
    onboardingComplete : Bool;
    lastDebtResetDate : Time.Time;
  };

  public type TaskCompletion = {
    taskId : Nat;
    taskTitle : Text;
    coinsEarned : Nat;
    completedAt : Time.Time;
  };

  // Initialization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let tasks = Map.empty<Principal, List.List<Task>>();
  let rewards = Map.empty<Principal, List.List<Reward>>();
  let redemptions = Map.empty<Principal, List.List<Redemption>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let taskCompletions = Map.empty<Principal, List.List<TaskCompletion>>();
  var nextTaskId = Map.empty<Principal, Nat>();
  var nextRewardId = Map.empty<Principal, Nat>();
  var nextRedemptionId = Map.empty<Principal, Nat>();

  // Helper Functions
  func ensureUserProfile(caller : Principal) : UserProfile {
    switch (userProfiles.get(caller)) {
      case (null) {
        // Create default profile with preset tasks
        let defaultProfile : UserProfile = {
          coinBalance = 10;
          onboardingComplete = false;
          lastDebtResetDate = Time.now();
        };
        userProfiles.add(caller, defaultProfile);

        // Add preset tasks
        let presetTasks = List.empty<Task>();
        presetTasks.add({
          id = 0;
          title = "5 Push-ups";
          taskType = #pushups;
          targetReps = 5;
          coinReward = 5;
          repeatOption = #daily;
          priority = false;
          completedAt = null;
          isActive = true;
        });
        presetTasks.add({
          id = 1;
          title = "20 Sit-ups";
          taskType = #situps;
          targetReps = 20;
          coinReward = 10;
          repeatOption = #daily;
          priority = false;
          completedAt = null;
          isActive = true;
        });
        tasks.add(caller, presetTasks);
        nextTaskId.add(caller, 2);
        nextRewardId.add(caller, 0);
        nextRedemptionId.add(caller, 0);

        defaultProfile;
      };
      case (?profile) { profile };
    };
  };

  func checkDebtReset(caller : Principal, profile : UserProfile) : UserProfile {
    let now = Time.now();
    let oneDayNanos : Int = 24 * 60 * 60 * 1_000_000_000;

    if (now > profile.lastDebtResetDate and profile.coinBalance < 0) {
      let daysSinceReset = (now - profile.lastDebtResetDate) / oneDayNanos;
      if (daysSinceReset >= 1) {
        let updatedProfile = {
          profile with
          coinBalance = 0;
          lastDebtResetDate = now;
        };
        userProfiles.add(caller, updatedProfile);
        return updatedProfile;
      };
    };
    profile;
  };

  func getNextTaskId(caller : Principal) : Nat {
    switch (nextTaskId.get(caller)) {
      case (null) { 0 };
      case (?id) { id };
    };
  };

  func incrementTaskId(caller : Principal) {
    let current = getNextTaskId(caller);
    nextTaskId.add(caller, current + 1);
  };

  func getNextRewardId(caller : Principal) : Nat {
    switch (nextRewardId.get(caller)) {
      case (null) { 0 };
      case (?id) { id };
    };
  };

  func incrementRewardId(caller : Principal) {
    let current = getNextRewardId(caller);
    nextRewardId.add(caller, current + 1);
  };

  func getNextRedemptionId(caller : Principal) : Nat {
    switch (nextRedemptionId.get(caller)) {
      case (null) { 0 };
      case (?id) { id };
    };
  };

  func incrementRedemptionId(caller : Principal) {
    let current = getNextRedemptionId(caller);
    nextRedemptionId.add(caller, current + 1);
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    let profile = ensureUserProfile(caller);
    let updatedProfile = checkDebtReset(caller, profile);
    ?updatedProfile;
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile() : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    let profile = ensureUserProfile(caller);
    checkDebtReset(caller, profile);
  };

  public shared ({ caller }) func markOnboardingComplete() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete onboarding");
    };
    let profile = ensureUserProfile(caller);
    let updatedProfile = {
      profile with
      onboardingComplete = true;
    };
    userProfiles.add(caller, updatedProfile);
  };

  // Task Management
  public shared ({ caller }) func addTask(title : Text, taskType : { #pushups; #situps; #custom : Text }, targetReps : Nat, coinReward : Nat, repeatOption : { #daily; #weekly; #custom : Nat; #never }, priority : Bool) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add tasks");
    };

    let taskId = getNextTaskId(caller);
    let newTask : Task = {
      id = taskId;
      title = title;
      taskType = taskType;
      targetReps = targetReps;
      coinReward = coinReward;
      repeatOption = repeatOption;
      priority = priority;
      completedAt = null;
      isActive = true;
    };

    let userTasks = switch (tasks.get(caller)) {
      case (null) { List.empty<Task>() };
      case (?existingTasks) { existingTasks };
    };
    userTasks.add(newTask);
    tasks.add(caller, userTasks);
    incrementTaskId(caller);
    taskId;
  };

  public shared ({ caller }) func updateTask(taskId : Nat, title : Text, taskType : { #pushups; #situps; #custom : Text }, targetReps : Nat, coinReward : Nat, repeatOption : { #daily; #weekly; #custom : Nat; #never }, priority : Bool, isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tasks");
    };

    let userTasks = switch (tasks.get(caller)) {
      case (null) { Runtime.trap("Task not found") };
      case (?existingTasks) { existingTasks };
    };

    var found = false;
    let updatedTasks = userTasks.map<Task, Task>(
      func(t : Task) : Task {
        if (t.id == taskId) {
          found := true;
          {
            id = taskId;
            title = title;
            taskType = taskType;
            targetReps = targetReps;
            coinReward = coinReward;
            repeatOption = repeatOption;
            priority = priority;
            completedAt = t.completedAt;
            isActive = isActive;
          };
        } else {
          t;
        };
      }
    );

    if (not found) {
      Runtime.trap("Task not found");
    };

    tasks.add(caller, updatedTasks);
  };

  public shared ({ caller }) func deleteTask(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasks");
    };

    let userTasks = switch (tasks.get(caller)) {
      case (null) { Runtime.trap("Task not found") };
      case (?existingTasks) { existingTasks };
    };
    let filteredTasks = userTasks.filter(func(t : Task) : Bool { t.id != taskId });
    tasks.add(caller, filteredTasks);
  };

  public query ({ caller }) func getTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    switch (tasks.get(caller)) {
      case (null) { [] };
      case (?userTasks) { userTasks.toArray() };
    };
  };

  // Task Completion
  public shared ({ caller }) func completeTask(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete tasks");
    };

    let userTasks = switch (tasks.get(caller)) {
      case (null) { Runtime.trap("Task not found") };
      case (?existingTasks) { existingTasks };
    };

    var foundTask : ?Task = null;
    for (task in userTasks.values()) {
      if (task.id == taskId) {
        foundTask := ?task;
      };
    };

    switch (foundTask) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (not task.isActive) {
          Runtime.trap("Cannot complete inactive task");
        };

        let now = Time.now();
        let updatedTask = {
          task with
          completedAt = ?now;
        };

        let updatedTasks = userTasks.map<Task, Task>(
          func(t : Task) : Task {
            if (t.id == taskId) { updatedTask } else { t };
          }
        );
        tasks.add(caller, updatedTasks);

        // Add coins to balance
        let profile = ensureUserProfile(caller);
        let updatedProfile = {
          profile with
          coinBalance = profile.coinBalance + task.coinReward;
        };
        userProfiles.add(caller, updatedProfile);

        // Record completion
        let completion : TaskCompletion = {
          taskId = task.id;
          taskTitle = task.title;
          coinsEarned = task.coinReward;
          completedAt = now;
        };
        let userCompletions = switch (taskCompletions.get(caller)) {
          case (null) { List.empty<TaskCompletion>() };
          case (?existing) { existing };
        };
        userCompletions.add(completion);
        taskCompletions.add(caller, userCompletions);
      };
    };
  };

  public query ({ caller }) func getTaskCompletionHistory() : async [TaskCompletion] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view completion history");
    };

    let thirtyDaysNanos : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    let cutoffTime = Time.now() - thirtyDaysNanos;

    switch (taskCompletions.get(caller)) {
      case (null) { [] };
      case (?completions) {
        let filtered = completions.filter(func(c : TaskCompletion) : Bool {
          c.completedAt >= cutoffTime;
        });
        filtered.toArray();
      };
    };
  };

  // Reward Management
  public shared ({ caller }) func addReward(name : Text, coinCost : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add rewards");
    };

    let rewardId = getNextRewardId(caller);
    let newReward : Reward = {
      id = rewardId;
      name = name;
      coinCost = coinCost;
    };

    let userRewards = switch (rewards.get(caller)) {
      case (null) { List.empty<Reward>() };
      case (?existingRewards) { existingRewards };
    };
    userRewards.add(newReward);
    rewards.add(caller, userRewards);
    incrementRewardId(caller);
    rewardId;
  };

  public shared ({ caller }) func updateReward(rewardId : Nat, name : Text, coinCost : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update rewards");
    };

    let userRewards = switch (rewards.get(caller)) {
      case (null) { Runtime.trap("Reward not found") };
      case (?existingRewards) { existingRewards };
    };

    var found = false;
    let updatedRewards = userRewards.map<Reward, Reward>(
      func(r : Reward) : Reward {
        if (r.id == rewardId) {
          found := true;
          { id = rewardId; name = name; coinCost = coinCost };
        } else {
          r;
        };
      }
    );

    if (not found) {
      Runtime.trap("Reward not found");
    };

    rewards.add(caller, updatedRewards);
  };

  public shared ({ caller }) func deleteReward(rewardId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete rewards");
    };

    let userRewards = switch (rewards.get(caller)) {
      case (null) { Runtime.trap("Reward not found") };
      case (?existingRewards) { existingRewards };
    };
    let filteredRewards = userRewards.filter(func(r : Reward) : Bool { r.id != rewardId });
    rewards.add(caller, filteredRewards);
  };

  public query ({ caller }) func getRewards() : async [Reward] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rewards");
    };

    switch (rewards.get(caller)) {
      case (null) { [] };
      case (?userRewards) { userRewards.toArray() };
    };
  };

  // Reward Redemption
  public shared ({ caller }) func redeemCustomReward(rewardId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can redeem rewards");
    };

    let profile = ensureUserProfile(caller);
    let userRewards = switch (rewards.get(caller)) {
      case (null) { Runtime.trap("Reward not found") };
      case (?existingRewards) { existingRewards };
    };

    var foundReward : ?Reward = null;
    for (reward in userRewards.values()) {
      if (reward.id == rewardId) {
        foundReward := ?reward;
      };
    };

    switch (foundReward) {
      case (null) { Runtime.trap("Reward not found") };
      case (?reward) {
        let newBalance = profile.coinBalance - reward.coinCost;
        if (newBalance < -15) {
          Runtime.trap("Insufficient balance: would go below -15");
        };

        let updatedProfile = {
          profile with
          coinBalance = newBalance;
        };
        userProfiles.add(caller, updatedProfile);

        // Record redemption
        let redemptionId = getNextRedemptionId(caller);
        let redemption : Redemption = {
          id = redemptionId;
          rewardType = #customReward(rewardId);
          coinsSpent = reward.coinCost;
          timestamp = Time.now();
        };
        let userRedemptions = switch (redemptions.get(caller)) {
          case (null) { List.empty<Redemption>() };
          case (?existing) { existing };
        };
        userRedemptions.add(redemption);
        redemptions.add(caller, userRedemptions);
        incrementRedemptionId(caller);
      };
    };
  };

  public shared ({ caller }) func redeemScreenTime(minutes : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can redeem screen time");
    };

    let profile = ensureUserProfile(caller);
    let coinCost = if (minutes == 15) { 15 } else if (minutes == 60) { 60 } else { minutes };

    let newBalance = profile.coinBalance - coinCost;
    if (newBalance < -15) {
      Runtime.trap("Insufficient balance: would go below -15");
    };

    let updatedProfile = {
      profile with
      coinBalance = newBalance;
    };
    userProfiles.add(caller, updatedProfile);

    // Record redemption
    let redemptionId = getNextRedemptionId(caller);
    let redemption : Redemption = {
      id = redemptionId;
      rewardType = #screenTime(minutes);
      coinsSpent = coinCost;
      timestamp = Time.now();
    };
    let userRedemptions = switch (redemptions.get(caller)) {
      case (null) { List.empty<Redemption>() };
      case (?existing) { existing };
    };
    userRedemptions.add(redemption);
    redemptions.add(caller, userRedemptions);
    incrementRedemptionId(caller);
  };

  public query ({ caller }) func getRedemptionHistory() : async [Redemption] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view redemption history");
    };

    let thirtyDaysNanos : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    let cutoffTime = Time.now() - thirtyDaysNanos;

    switch (redemptions.get(caller)) {
      case (null) { [] };
      case (?userRedemptions) {
        let filtered = userRedemptions.filter(func(r : Redemption) : Bool {
          r.timestamp >= cutoffTime;
        });
        filtered.toArray();
      };
    };
  };
};
